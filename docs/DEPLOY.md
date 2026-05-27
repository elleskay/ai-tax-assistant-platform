# Deploy guide

Reference for deploying apps cloned from this platform. The `.github/workflows/deploy.yml` automates everything below; this doc explains what it does and the gotchas the workflow handles for you.

## One-time AWS setup

### CDK bootstrap

```bash
npx cdk bootstrap aws://<account-id>/<region>
```

You only need this once per account+region. Bootstrap provisions the CDK toolkit stack (S3 staging bucket, ECR repo for container assets, IAM roles).

### OIDC role for GitHub Actions

1. In AWS IAM, add `token.actions.githubusercontent.com` as an OIDC provider.
2. Create a role with this trust policy (replace the GitHub path):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {
         "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com"
       },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": {
           "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
         },
         "StringLike": {
           "token.actions.githubusercontent.com:sub": "repo:elleskay/my-app:*"
         }
       }
     }]
   }
   ```

3. Attach the policy from `infra/iam/cdk-deploy-policy.json` to this role.
4. Add the role ARN to GitHub Actions secrets as `AWS_DEPLOY_ROLE_ARN`.

### GitHub Actions secrets and variables

| Setting | Type | Value |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | secret | OIDC role ARN |
| `DATABASE_URL` | secret | Postgres connection string |
| `AUTH_SECRET` | secret | `openssl rand -base64 32` |
| `AWS_REGION` | variable | e.g. `ap-southeast-1` |
| `APP_URL` | variable | Your CloudFront URL or custom domain |
| `ALLOWED_ORIGINS` | variable | CloudFront host + Lambda URL host, comma-separated |

## What the deploy does

`.github/workflows/deploy.yml` runs on push to `main`:

1. Checkout, install Node 20, restore npm cache.
2. Assume the OIDC role.
3. Install workspace dependencies (`npm ci`).
4. Build the Next.js app with OpenNext (`npm run build:open-next` in `apps/web/`). Env vars passed in: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `ALLOWED_ORIGINS`.
5. Install CDK deps (`npm ci` in `infra/cdk/app/`).
6. `cdk deploy --all` with the same env vars. CDK reads them at synth time and bakes them into the Lambda env.
7. Read the deployed URL from `cdk-outputs.json`.
8. Run `scripts/verify-deploy.sh` against that URL. Fails the workflow if any smoke check fails.

## Rollback

CDK does not auto-rollback on app-level failure. If a deploy ships broken code:

1. `git revert <bad-commit>` and push. The next deploy uses the previous CloudFormation state.
2. For data migrations, never run destructive operations in deploy. Use a separate one-off job with explicit approval.

## Gotchas baked into the platform

These all bit us in production. The platform encodes the fixes; do not undo them.

### 1. Server Actions reject CloudFront → Lambda forwarded requests

**Symptom:** Form submits hit "Invalid Server Actions request" because Next.js compares `x-forwarded-host` (Lambda URL) with `origin` (CloudFront).

**Fix:** `next.config.ts` reads `ALLOWED_ORIGINS` at build time and passes both hosts to `experimental.serverActions.allowedOrigins`. The pattern is in `apps/_template/next.config.ts`.

### 2. NextAuth redirects to the Lambda URL after login

**Symptom:** After login, browser URL becomes `https://xxx.lambda-url.<region>.on.aws/...` and CSS/static assets stop loading because S3 assets are only served via CloudFront.

**Fix:** Set `AUTH_URL` to the canonical CloudFront URL (or custom domain). The CDK construct sets this from the `AUTH_URL` prop. Set the GitHub variable `APP_URL` to your deployed URL.

### 3. Sign-out via server action fails to clear cookies

**Symptom:** Click sign out, page stays logged in. Lambda logs show 303 with `x-action-redirect` but no `Set-Cookie`.

**Fix:** Use `apps/_template/components/SignOutButton.tsx` which calls `signOut` from `next-auth/react`. That goes through `/api/auth/signout` which clears cookies correctly.

### 4. CDK env vars are baked at synth, not deploy

**Symptom:** You set `AUTH_URL` in `.env` file expecting Lambda to read it. Lambda has no `AUTH_URL` at runtime.

**Fix:** `cdk deploy` reads `process.env.*` when it synthesizes the stack. The CDK construct copies those into the Lambda's `environment`. Set env vars in the shell (or GitHub Actions `env:` block) that invokes `cdk deploy`.

### 5. OpenNext image-opt function won't build on Windows

**Symptom:** `ERROR Error: ENOENT: no such file or directory, mkdtemp 'C:\...\.open-next\image-optimization-functionXXXXXX'`.

**Fix:** Build on Linux/macOS/WSL. If you must build on Windows and your app uses no `next/image`, the deploy still works — the image function bundle is incomplete but never invoked.

### 6. `cdk bootstrap` fails if your stacks reference missing build assets

**Symptom:** `Cannot find asset at <path>/.open-next/assets`.

**Fix:** Run `open-next build` in `apps/web/` before any CDK command (including bootstrap), because `bin/app.ts` instantiates the stack on synth and the construct reads `.open-next/` paths.

## Environments

Default: `production`. Add `staging` by:

1. Creating a separate GitHub environment with its own secrets/vars (different `APP_URL`, `DATABASE_URL`, etc).
2. Choosing it via `workflow_dispatch` from the Actions tab, or adding a separate workflow that triggers on a `staging` branch.

For real multi-environment, deploy each to a separate AWS account.

## Cost expectations

For a typical portfolio app with negligible traffic:

| Resource | Monthly |
|---|---|
| Lambda invocations + duration (Free Tier covers 1M req + 400k GB-s) | $0 |
| S3 storage (~50 MB) + GET requests | <$0.10 |
| CloudFront transfer (Free Tier covers 1TB) | $0 |
| CloudWatch Logs | ~$0.50 |
| **Total realistic idle** | **<$1** |

At 100k requests/day you're still well within Free Tier. The Lambda + CloudFront pattern is genuinely cheap at low scale.

# Setup checklist

Follow in order on a fresh clone. Skipping steps will bite you later.

## 1. Clone the template

```bash
gh repo create my-app --template elleskay/platform --clone --private
cd my-app
```

## 2. GitHub repo settings

- [ ] Set default branch to `main`
- [ ] Enable branch protection on `main`: require PR, require CI to pass
- [ ] Enable Dependabot alerts and security updates (Settings, Security)
- [ ] Enable secret scanning (Settings, Code security)
- [ ] Update `.github/CODEOWNERS` to your GitHub handle
- [ ] Update `SECURITY.md` with your real disclosure email

## 3. Scaffold the Next.js app

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app --eslint --use-npm
cd apps/web
npm install next-auth@beta zod
npm install @opennextjs/aws
# Pick your data layer
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
cd ../..
```

## 4. Overlay the reference patterns

```bash
cp apps/_template/next.config.ts apps/web/
cp apps/_template/auth.config.ts apps/web/
cp apps/_template/middleware.ts apps/web/
mkdir -p apps/web/components
cp apps/_template/components/SignOutButton.tsx apps/web/components/
```

Add `output: "standalone"` if it's missing from your `next.config.ts` (it's in the template).

## 5. Configure npm workspaces

Edit root `package.json`:

```json
{
  "workspaces": ["apps/*"]
}
```

Run `npm install` at root.

## 6. Set up CDK for the app

```bash
mkdir -p infra/cdk/app/{bin,lib}
cp -r infra/cdk/constructs infra/cdk/    # already at the platform root, copying isn't needed
```

Create `infra/cdk/app/bin/app.ts`, `infra/cdk/app/lib/web-stack.ts`, `package.json`, `tsconfig.json`, `cdk.json`. See `infra/cdk/constructs/README.md` for the construct usage example.

## 7. AWS account setup

- [ ] Create an AWS account (or use an existing one)
- [ ] Region: pick one close to your users (e.g. `ap-southeast-1` for Singapore)
- [ ] Create an IAM user `cdk-deploy` (or a role, if using OIDC from GitHub)
- [ ] Attach the policy from `infra/iam/cdk-deploy-policy.json` (don't use `AdministratorAccess`)
- [ ] Create an access key, configure `~/.aws/credentials`
- [ ] Bootstrap CDK once: `npx cdk bootstrap aws://<account>/<region>`

## 8. GitHub Actions OIDC

For automated deploys from `.github/workflows/deploy.yml`:

- [ ] In AWS IAM, add `token.actions.githubusercontent.com` as an OIDC identity provider
- [ ] Create a role with trust policy scoped to your GitHub repo
- [ ] Attach the same `cdk-deploy-policy.json` to it
- [ ] Add `AWS_DEPLOY_ROLE_ARN` to GitHub Actions **secrets**
- [ ] Add `AWS_REGION`, `APP_URL`, `ALLOWED_ORIGINS` to GitHub Actions **variables**
- [ ] Add `DATABASE_URL`, `AUTH_SECRET` to GitHub Actions **secrets**

`APP_URL` should be your CloudFront URL or custom domain. `ALLOWED_ORIGINS` should be the CloudFront host and the Lambda Function URL host, comma-separated. You won't know the Lambda URL until first deploy; for the first build, use `*.cloudfront.net,*.lambda-url.<region>.on.aws`, then refine after deploy.

## 9. First deploy

```bash
git add . && git commit -m "chore: initial scaffold"
git push -u origin main
```

GitHub Actions runs CI, builds OpenNext, deploys via CDK, smoke-tests the URL. If all checks pass, your CloudFront URL is live.

## What you always forget

- Step 7: Attaching the IAM policy instead of relying on root access
- Step 8: Setting `APP_URL` (NextAuth breaks without it)
- Step 8: Setting `ALLOWED_ORIGINS` (Server Actions break without it)
- Step 6: `output: "standalone"` in `next.config.ts` (OpenNext won't work without it)

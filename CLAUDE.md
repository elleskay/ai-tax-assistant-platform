# Platform template, Claude Code conventions

This repo is a platform-layer template for Next.js apps on AWS serverless. When working in repos cloned from it, follow these rules.

## What belongs in this template

Only the cross-cutting platform layer:

- CI/CD workflows (`.github/workflows/`)
- Reusable CDK constructs (`infra/cdk/constructs/`)
- IAM policy JSON (`infra/iam/`)
- Reference app scaffold (`apps/_template/`) for patterns each app reuses
- Smoke-test script (`scripts/verify-deploy.sh`)
- Base TS/ESLint/Prettier/Commitlint configs (root)
- Security policy, SSDLC docs, deploy runbook
- Dependabot, CODEOWNERS, PR template

## What does NOT belong

- App code (no Next.js routes, no business logic, no DB schema)
- Per-product config, secrets, or env files
- Speculative variants for stacks no real app uses

When asked to add app code, scaffold it under `apps/<name>/` in the cloned repo, not in the platform.

## Stack conventions

- Next.js (App Router) + TypeScript strict
- Node 20+
- Postgres (Neon for connection pooling on serverless)
- AWS Lambda + S3 + CloudFront via OpenNext
- AWS CDK for IaC
- GitHub Actions for CI/CD
- Auth.js v5 with JWT sessions
- Zod for input validation at server-action boundaries
- Conventional Commits

## Style

- No em dashes anywhere (chat, code, docs, UI strings). Use comma, period, parens, or colon.
- No emojis in code or docs unless explicitly requested.
- Keep README and docs short. Lead with the answer.

## Security defaults

- Never commit secrets. `.env.local` is gitignored, production secrets live in GitHub Actions secrets and Lambda env vars.
- Security headers configured in `apps/_template/next.config.ts`.
- Input validation via Zod on every server action.
- Dependabot enabled, weekly cadence.
- The IAM policy in `infra/iam/cdk-deploy-policy.json` is the least-privilege baseline for the deploy user. Use it instead of `AdministratorAccess`.

## Known production gotchas (do not relearn)

These all bit us in real deploys. The platform encodes the fixes; don't undo them.

1. **Server Actions need `allowedOrigins`** with both CloudFront domain and Lambda Function URL host. Read from `ALLOWED_ORIGINS` env at build time, configured in `next.config.ts`.
2. **`AUTH_URL` env var must be set** to the canonical public URL (CloudFront or custom domain), or NextAuth redirects to the raw Lambda URL.
3. **Sign-out must use the client-side `signOut` from `next-auth/react`**, not a server-action form. The server path doesn't reliably clear cookies through OpenNext's Lambda streaming.
4. **`open-next build` must run before `cdk bootstrap` or `cdk deploy`** because the CDK stacks reference `.open-next/` paths as Lambda assets.
5. **CDK env vars are baked at synth time**, not deploy time. Set them in the shell that runs `cdk deploy`.
6. **OpenNext image-optimization function fails to install its deps on Windows** (mkdtemp path-with-colon issue). Build on Linux/macOS/WSL.

Full details in `docs/DEPLOY.md`.

## When adding a new app to a cloned repo

1. Scaffold `apps/web` with create-next-app
2. Overlay reference patterns from `apps/_template/` (next.config.ts, auth.config.ts, middleware.ts, SignOutButton)
3. Copy `infra/cdk/constructs/` into the app's repo
4. Write a thin CDK stack at `infra/cdk/app/` that instantiates `NextjsServerless`
5. Configure GitHub secrets/vars per `docs/DEPLOY.md`, push, verify smoke test passes

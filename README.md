# platform

TypeScript platform template for shipping Next.js apps to AWS serverless. CI/CD, IaC, security, governance, pre-canned IAM, a verified deploy workflow.

Designed to be cloned per-app, not vendored as a dependency.

## What's inside

| Area | Where |
|---|---|
| CI (typecheck, lint, build) | `.github/workflows/ci.yml` |
| Security scanning (CodeQL, secrets, npm audit) | `.github/workflows/security.yml` |
| Deploy pipeline (build OpenNext, CDK deploy, smoke test) | `.github/workflows/deploy.yml` |
| Reusable CDK construct (Lambda + S3 + CloudFront for Next.js) | `infra/cdk/constructs/NextjsServerless.ts` |
| Pre-canned IAM policy for the deploy user/role | `infra/iam/cdk-deploy-policy.json` |
| Reference app scaffold (Auth + middleware + signout patterns) | `apps/_template/` |
| Smoke-test script (catches real production failures) | `scripts/verify-deploy.sh` |
| Stack and security guidance | `docs/` |
| TS/ESLint/Prettier base configs | root |
| Conventional commits + commitlint | `commitlint.config.mjs` |

## How to use

1. Create your app repo from this template:
   ```bash
   gh repo create my-app --template elleskay/platform --clone --private
   cd my-app
   ```
2. Scaffold a Next.js app at `apps/web` and overlay the reference patterns from `apps/_template/`. See `docs/variants/default-nextjs.md`.
3. Add `infra/cdk/app/` with a CDK stack that uses `NextjsServerless`. See `infra/cdk/constructs/README.md`.
4. Configure AWS (OIDC + IAM policy from `infra/iam/`), set the GitHub secrets/vars, push. The deploy workflow handles the rest.

Full step-by-step in `docs/SETUP.md` and `docs/DEPLOY.md`.

## Opinions

The platform makes a few deliberate choices that constrain the happy path:

- **Serverless only.** Lambda + CloudFront + S3 via OpenNext. ~$0-2/month idle. If you need always-on containers, fork.
- **No shared infra base.** Each app is self-contained. Sharing VPCs across portfolio apps is premature.
- **No NestJS / no mobile / no AI-specific variant docs.** They were speculation. Add a variant only when a real app needs one.
- **Constructs are copied, not imported.** Each app pins its version of `NextjsServerless`. Breaking changes don't propagate without explicit action.

The smaller the surface area, the fewer wrong-by-default ways apps can diverge.

## License

MIT.

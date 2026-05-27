# CDK constructs

Reusable building blocks for app-specific CDK stacks.

## How to use

When you scaffold a new app from this template, **copy this directory into your app's repo** under `infra/cdk/constructs/`. Each app owns its own copy so updates can't break shipped apps.

```bash
# from your cloned app repo
mkdir -p infra/cdk/constructs
cp -r <platform-clone>/infra/cdk/constructs/*.ts infra/cdk/constructs/
```

Then in your app's CDK stack:

```ts
import { NextjsServerless } from "../constructs/NextjsServerless";

new NextjsServerless(this, "Web", {
  appPath: path.resolve(__dirname, "..", "..", "..", "apps", "web"),
  environment: {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "",
    AUTH_URL: process.env.AUTH_URL ?? "",
  },
});
```

That's ~5 lines instead of ~150 lines of raw CDK per app.

## Available constructs

- **`NextjsServerless.ts`** — Lambda + S3 + CloudFront for Next.js apps built with OpenNext. Encodes all the production gotchas (allowed-origins, AUTH_URL, signout, image optimization). See the JSDoc on `NextjsServerlessProps` for what to pass and which env vars matter.

## Why constructs, not stacks?

Stacks own the "lifecycle" boundary (deploy unit). Constructs are composable pieces. Apps assemble stacks from constructs so the deploy boundary stays per-app, but the building blocks are shared.

## Why copy and not import as a package?

For a portfolio platform, npm publishing is overhead without payoff. The copy-on-scaffold pattern means each app pins its version of the construct, and breaking changes never propagate without explicit action.

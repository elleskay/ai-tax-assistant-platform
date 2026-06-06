import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NextjsServerless } from "./constructs/NextjsServerless";

// Default to the conventional `apps/web` location. Override via PLATFORM_DEMO_APP_PATH
// so platform CI can point at `apps/_demo` for self-test without rewriting this file.
const APP_REL = process.env.PLATFORM_DEMO_APP_PATH ?? "apps/web";

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new NextjsServerless(this, "Web", {
      appPath: path.resolve(__dirname, "..", "..", "..", "..", APP_REL),
      environment: {
        // The chat agent's runtime secret. Baked at synth (docs/DEPLOY.md #13),
        // so it MUST ALSO be forwarded in the deploy workflow's CDK-deploy step
        // (.github/workflows/deploy.yml) and stored as a GitHub Actions secret.
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "",
      },
      // The chat route streams from the LLM and can exceed the 30s default.
      // Raises both the Lambda timeout and the CloudFront origin read timeout
      // (docs/DEPLOY.md #14). Matches the route's maxDuration = 60.
      serverTimeoutSeconds: 60,
      // Optional: provide a custom domain.
      // customDomain: {
      //   domainName: "iras-tax.example.com",
      //   certificateArn: "arn:aws:acm:us-east-1:...",
      //   hostedZoneId: "Z123ABCDE",
      // },
    });
  }
}

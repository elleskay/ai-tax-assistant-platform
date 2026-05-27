import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface NextjsServerlessProps {
  /**
   * Absolute or stack-relative path to the Next.js app directory.
   * The `.open-next/` build output must exist under this path.
   */
  readonly appPath: string;

  /**
   * Environment variables to set on the server Lambda.
   * Critical ones to always include:
   *  - DATABASE_URL
   *  - AUTH_SECRET
   *  - AUTH_URL (set this to the deployed CloudFront URL or a custom domain;
   *    if you omit it, NextAuth will fall back to the Lambda Function URL,
   *    which breaks redirects and cookies behind CloudFront)
   */
  readonly environment: Record<string, string>;

  /**
   * Memory size for the server Lambda. Default 1024.
   */
  readonly serverMemoryMb?: number;

  /**
   * CloudFront price class. Default PRICE_CLASS_200 (NA, EU, AP).
   */
  readonly priceClass?: cloudfront.PriceClass;
}

/**
 * Deploys a Next.js app (built with OpenNext) as Lambda + S3 + CloudFront.
 *
 * Encodes the gotchas you'd otherwise have to learn in production:
 *  - Server Actions allowed-origins must include the CloudFront domain AND
 *    the Lambda Function URL host. The app must read ALLOWED_ORIGINS at
 *    build time. This construct outputs both hosts as a CfnOutput so a
 *    follow-up build can pick them up; for a green-field deploy, pass
 *    ALLOWED_ORIGINS=*.cloudfront.net,*.lambda-url.<region>.on.aws at
 *    build time and refine after first deploy.
 *  - AUTH_URL must point to the public CloudFront URL, not the Lambda URL.
 *  - Server-side `signOut()` does not reliably clear cookies on this
 *    deploy path. Use a client component that calls signOut from
 *    next-auth/react. The apps/_template/components/SignOutButton.tsx in
 *    the platform template shows the right pattern.
 *  - The image-optimization function fails to install its deps on
 *    Windows due to a path-with-colon mkdtemp issue. Build on
 *    macOS/Linux/WSL, or skip Next.js Image usage if you must build on
 *    Windows.
 */
export class NextjsServerless extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly assetsBucket: s3.Bucket;
  public readonly serverFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: NextjsServerlessProps) {
    super(scope, id);

    const openNextDir = path.join(props.appPath, ".open-next");

    this.assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, "AssetsDeployment", {
      sources: [s3deploy.Source.asset(path.join(openNextDir, "assets"))],
      destinationBucket: this.assetsBucket,
      prune: true,
    });

    this.serverFunction = new lambda.Function(this, "ServerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "server-functions", "default")),
      memorySize: props.serverMemoryMb ?? 1024,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        NODE_ENV: "production",
        AUTH_TRUST_HOST: "true",
        ...props.environment,
      },
      logRetention: 14,
    });

    const serverFunctionUrl = this.serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });

    const imageFunction = new lambda.Function(this, "ImageFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(openNextDir, "image-optimization-function")),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        BUCKET_NAME: this.assetsBucket.bucketName,
        BUCKET_KEY_PREFIX: "",
      },
      logRetention: 14,
    });

    this.assetsBucket.grantRead(imageFunction);

    const imageFunctionUrl = imageFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const requestForwardAll = cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(serverFunctionUrl, {
          readTimeout: cdk.Duration.seconds(30),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: requestForwardAll,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      additionalBehaviors: {
        "/_next/static/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.assetsBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        "/_next/image*": {
          origin: new origins.FunctionUrlOrigin(imageFunctionUrl),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: requestForwardAll,
        },
        "/favicon.ico": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.assetsBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_200,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    this.serverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"],
        resources: [this.assetsBucket.bucketArn, `${this.assetsBucket.bucketArn}/*`],
      }),
    );

    new cdk.CfnOutput(scope as cdk.Stack, `${id}DistributionUrl`, {
      value: `https://${this.distribution.distributionDomainName}`,
      description: "Public URL",
    });

    new cdk.CfnOutput(scope as cdk.Stack, `${id}LambdaUrlHost`, {
      value: cdk.Fn.select(2, cdk.Fn.split("/", serverFunctionUrl.url)),
      description:
        "Lambda Function URL host. Add this to ALLOWED_ORIGINS at the next build so Server Actions accept forwarded-host.",
    });
  }
}

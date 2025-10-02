/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "optimic-ai",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: { aws: "7.7.0", random: "4.18.3" },
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const { userPool, userPoolClient } = await import("./infra/cognito");
    await import("./infra/api");
    await import("./infra/web");
    return {
      MyBucket: storage.bucket.name,
      UserPool: userPool.id,
      Region: aws.getRegionOutput().region,
      UserPoolClient: userPoolClient.id,
    };
  },
});

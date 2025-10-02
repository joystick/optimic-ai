import { bucket } from "./storage";
import { userPool, userPoolClient } from "./cognito";

export const web = new sst.aws.Nextjs("MyWeb", {
  link: [bucket, userPool, userPoolClient],
  path: "packages/web/",
  buildCommand: "npx --yes @opennextjs/aws@^3 build",
  environment: {
    NEXT_PUBLIC_USER_POOL_ID: userPool.id,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: userPoolClient.id,
  },
});

import { bucket } from "./storage";

export const web = new sst.aws.Nextjs("MyWeb", {
  link: [bucket],
  path: "packages/web/",
  buildCommand: "npm run build",
});

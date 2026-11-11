import { defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";

export const environment = VercelSandbox.environment();

// 普段は外への通信をすべて止めておく
export default defineSandbox(async () => {
  const sandbox = await environment.open();
  await sandbox.setNetworkPolicy("deny-all");
  return sandbox;
});

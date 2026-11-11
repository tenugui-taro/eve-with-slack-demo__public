import { connect } from "@vercel/connect/eve";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { environment } from "../sandbox";

const github = connect({ connector: "github/your-connector", principalType: "app" });
const allowedRepos = ["your-org/your-repo"] as const; // 調べてよいリポジトリ

// GitHub の Git エンドポイント用: x-access-token:<token> の Basic 認証
const gitHubBasicAuth = (token: string) =>
  `Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`;

export default defineTool({
  description: "Clone an allowed GitHub repository into the sandbox for investigation.",
  // 許可リストを enum にして、モデルが owner を推測せず候補から選べるようにする
  inputSchema: z.object({ repo: z.enum(allowedRepos).describe("owner/name") }),
  async execute({ repo }, ctx) {
    const { token } = await ctx.getToken(github); // トークンはここ（App runtime）にだけある
    const sandbox = await ctx.getSandbox(environment);

    // clone の間だけ github.com を開け、出口で認証ヘッダーを付け足す
    await sandbox.setNetworkPolicy({
      allow: {
        "github.com": [{ transform: [{ headers: { authorization: gitHubBasicAuth(token) } }] }],
      },
    });
    try {
      const result = await sandbox.run({
        command: `git clone --depth 1 https://github.com/${repo}.git repos/${repo}`,
      });
      if (result.exitCode !== 0) throw new Error(result.stderr);
    } finally {
      await sandbox.setNetworkPolicy("deny-all"); // 終わったらまた閉じる
    }
    return { path: `repos/${repo}` }; // あとは bash や read_file で探索する
  },
});

import { defineTool } from "eve/tools";
import { webFetch } from "eve/tools/web_fetch";

const knownHosts = new Set(["nextjs.org", "vercel.com", "eve.dev"]); // いつも開いてよいサイト

export default defineTool({
  ...webFetch,
  // 知っているサイトはそのまま開く。それ以外は Slack で人が URL を見て承認する
  approval: ({ toolInput }) => {
    const url = (toolInput as { url?: string } | undefined)?.url;
    if (!url) return { type: "denied", reason: "URL がありません" };
    return knownHosts.has(new URL(url).hostname) ? "not-applicable" : "user-approval";
  },
});

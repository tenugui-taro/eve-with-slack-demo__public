import { defineSchedule } from "eve/schedules";

import slack from "../channels/slack";

export default defineSchedule({
  cron: "0 0 * * 1-5", // 平日 9:00（JST）。Vercel の cron は UTC で動く
  async run({ to, waitUntil, appAuth }) {
    // 前回の実行以降に出た記事だけを見る（月曜は金曜から）
    const now = new Date();
    const days = now.getUTCDay() === 1 ? 3 : 1;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    const prompt = [
      `https://nextjs.org/feed.xml（RSS）を読んで、pubDate が ${since} 以降の記事を確認して。`,
      "投稿するのは、正式版のメジャー・マイナーリリース（例: 16.4, 17.0）と、セキュリティ修正の告知だけ。",
      "canary・beta・RC・セキュリティ以外のパッチリリース・イベントやその他の記事は対象外。",
      "対象があれば、記事ごとに公開日（日本時間）とリンクを付けて、日本語で3行に要約して。",
      "対象がなければ、no_reply を呼んで何も投稿しないで。",
    ].join("\n");

    waitUntil(
      // 投稿先のチャンネル ID に置き換える
      to(slack, { channelId: "C0XXXXXXXXX" }).send(prompt, {
        auth: appAuth, // Slack の誰かではなく、アプリ自身として動く
      }),
    );
  },
});

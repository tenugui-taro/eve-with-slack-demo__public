import { connectSlackCredentials } from "@vercel/connect/eve";
import { defaultSlackAuth, slackChannel, type SlackMessage } from "eve/channels/slack";

// 応答してよい Slack のチャンネルとユーザー。自分のワークスペースの ID に置き換える
const allowedChannels = new Set([
  "C0XXXXXXXXX", // 公開チャンネル
  "C0YYYYYYYYY", // プライベートチャンネル
]);
const allowedUsers = new Set(["U0XXXXXXXXX"]);

function isAllowedUser(message: SlackMessage) {
  const userId = message.author?.userId;
  return Boolean(userId && allowedUsers.has(userId));
}

export default slackChannel({
  credentials: connectSlackCredentials("slack/your-connector"),
  onAppMention(ctx, message) {
    if (!isAllowedUser(message) || !allowedChannels.has(message.channelId)) return null;
    return { auth: defaultSlackAuth(message, ctx) };
  },
  // DM はチャンネル ID が人ごとに違うので、人だけで判定する
  onDirectMessage(ctx, message) {
    if (!isAllowedUser(message)) return null;
    return { auth: defaultSlackAuth(message, ctx) };
  },
  onAnswers(ctx, submission) {
    if (!allowedUsers.has(submission.user.id)) return null;
    return { auth: ctx.defaultAuth };
  },
});

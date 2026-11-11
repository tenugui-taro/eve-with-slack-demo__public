# eve-slack-agent

[eve](https://eve.dev) で作った検証用エージェントです。Slack から呼び出し、Web の閲覧や GitHub リポジトリの調査を Vercel Sandbox 内で行います。平日の朝には Next.js の更新情報を Slack に投稿します。

## 構成

```
agent/
├── agent.ts              モデルの設定（openai/gpt-5.2, reasoning: high）
├── instructions.md       エージェントへの指示
├── sandbox.ts            Vercel Sandbox。通常は外への通信をすべて遮断（deny-all）
├── channels/
│   ├── eve.ts            eve TUI・REPL からの接続
│   └── slack.ts          Slack からの接続。許可したチャンネルとユーザーだけに応答
├── schedules/
│   └── nextjs-news.ts    平日 9:00（JST）に Next.js の RSS を確認し、リリースとセキュリティ告知を Slack に投稿
└── tools/
    ├── clone_repo.ts     許可リストの GitHub リポジトリを Sandbox に clone
    ├── web_fetch.ts      Web ページの取得。既知のサイト以外は人の承認が必要
    ├── web_search.ts     組み込みの Web 検索を無効化
    └── no_reply.ts       投稿することがないとき、何も投稿せずに終える
```

### 安全のための設計

- **Slack の入口を絞る**：`channels/slack.ts` で、応答するチャンネル ID とユーザー ID を許可リストで指定しています。リスト外からのメンションや DM は無視します。
- **Sandbox の通信は必要なときだけ開ける**：`sandbox.ts` は通常 deny-all です。`clone_repo` は clone の間だけ `github.com` への通信を許可し、終わったら再び閉じます。
- **トークンを Sandbox に渡さない**：GitHub のトークンはツールの実行側で取得し、Sandbox のネットワークポリシーで認証ヘッダーとして付与します。Sandbox 内のコードからトークンは見えません。
- **外部に情報を出さない**：組み込みの `web_search` は検索語が外部サービスに送られるため無効にしています。`web_fetch` は `nextjs.org`・`vercel.com`・`eve.dev` 以外の URL を開く前に、Slack で人の承認を求めます。

## 必要なもの

- Node.js 24
- Vercel プロジェクト（`eve link` で紐付け）
- Vercel Connect のコネクター
  - `slack/your-connector`（Slack 連携）
  - `github/your-connector`（GitHub App として clone する）

Slack のチャンネル ID・ユーザー ID（`channels/slack.ts`、`schedules/nextjs-news.ts`）と、clone を許可するリポジトリ（`tools/clone_repo.ts`）と、Vercel Connect のコネクター名はプレースホルダー（`C0XXXXXXXXX`、`your-org/your-repo`、`your-connector` など）にしてあります。自分の環境の値に書き換えてから使ってください。

## 開発

```bash
npm install
eve dev          # 対話セッションを起動
npm run typecheck
```

## デプロイ

```bash
eve deploy
```

詳しくは [eve のドキュメント](https://eve.dev/docs) を参照してください。

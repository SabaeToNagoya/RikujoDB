# RaceBase — 陸上競技情報システム

マラソン・中長距離選手の記録管理と観戦サポートのWebアプリケーション。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 14 (App Router + TypeScript)
- **DB**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: NextAuth.js（パスワード認証）
- **スタイル**: Tailwind CSS
- **ホスティング**: Vercel

---

## セットアップ手順

### 1. Supabaseの設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `Project Settings > Database > Connection string` から2種類のURLを取得
   - **Transaction pooler** (ポート6543): `DATABASE_URL` に使用
   - **Direct connection** (ポート5432): `DIRECT_URL` に使用

### 2. 環境変数の設定

Vercelのプロジェクト設定 → `Environment Variables` に以下を追加：

| 変数名 | 値 |
|-------|-----|
| `DATABASE_URL` | SupabaseのTransaction pooler URL |
| `DIRECT_URL` | SupabaseのDirect connection URL |
| `NEXTAUTH_SECRET` | ランダム文字列（下記コマンドで生成） |
| `NEXTAUTH_URL` | VercelのデプロイURL（例: `https://rikujo-db.vercel.app`） |
| `ADMIN_PASSWORD` | ログイン用パスワード（任意の文字列） |

```bash
# NEXTAUTH_SECRETの生成（ターミナルで実行）
openssl rand -base64 32
```

### 3. GitHubとVercelの連携

1. このリポジトリ (`SabaeToNagoya/RikusjoDB`) をVercelに接続
2. 上記の環境変数を設定
3. **Build Command**: `prisma generate && next build`（package.jsonに設定済み）
4. デプロイ

### 4. DBマイグレーション

初回デプロイ後、SupabaseのSQL Editorで以下を実行（または Vercel のデプロイログで確認）：

```bash
# Vercel Functions / ローカルから実行する場合
npx prisma db push
```

---

## CSVインポート フォーマット

| 列 | 必須 | 説明 |
|----|------|------|
| 選手名 | ✓ | DB登録済みの漢字氏名と完全一致 |
| 種目 | ✓ | 例: マラソン、1500m、5000m |
| 記録 | ✓ | 例: 2:06:35 / 13:24.75 |
| 大会名 | ✓ | 例: 東京マラソン 2024 |
| 日付 | ✓ | 例: 2024/3/3 |
| 所属チーム名 | | DB登録済みのチーム名 |
| 順位 | | 例: 1位 / 銅メダル |
| 備考 | | 自由記入 |

テンプレートは「記録取り込み」画面からダウンロードできます。

---

## 主な機能

- **選手管理**: プロフィール・記録の登録・編集・削除
- **チーム管理**: 所属選手・大会成績の管理
- **記録取り込み**: CSVアップロードによる一括登録
- **ランキング**: 種目別・性別・年別ランキング
- **つながり表示**: 出身校ベースの人間関係（同期・先輩・後輩）
- **観戦セットアップ**: 個人レース・駅伝の事前準備
- **観戦モード**: 当日の記録確認・選手比較

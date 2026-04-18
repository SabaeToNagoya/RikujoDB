-- パフォーマンスチューニング用インデックス
-- Supabase の SQL Editor で実行してください

-- Record テーブル: 種目（event）での検索・絞り込みを高速化
CREATE INDEX IF NOT EXISTS "Record_event_idx" ON "Record" ("event");

-- Record テーブル: タイム順ソート（ランキング表示）を高速化
CREATE INDEX IF NOT EXISTS "Record_timeSeconds_idx" ON "Record" ("timeSeconds");

-- Record テーブル: 種目＋タイム複合（ランキングAPIで最もよく使うパターン）
CREATE INDEX IF NOT EXISTS "Record_event_timeSeconds_idx" ON "Record" ("event", "timeSeconds");

-- Athlete テーブル: 性別フィルタを高速化
CREATE INDEX IF NOT EXISTS "Athlete_gender_idx" ON "Athlete" ("gender");

-- Record テーブル: 選手IDでの絞り込みを高速化（選手詳細ページ）
CREATE INDEX IF NOT EXISTS "Record_athleteId_idx" ON "Record" ("athleteId");

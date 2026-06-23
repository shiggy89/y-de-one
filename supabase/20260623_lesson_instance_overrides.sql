-- lesson_instances にコンテンツ上書き用カラムを追加
-- 今回のみ変更（先生・クラス名・種別・ストレッチ）を保存するため

ALTER TABLE lesson_instances
  ADD COLUMN IF NOT EXISTS actual_title       TEXT,
  ADD COLUMN IF NOT EXISTS actual_teacher     TEXT,
  ADD COLUMN IF NOT EXISTS actual_color_type  TEXT,
  ADD COLUMN IF NOT EXISTS actual_has_stretch BOOLEAN;

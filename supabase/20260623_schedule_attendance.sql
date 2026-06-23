-- =============================================
-- class_templates: 通常の繰り返しスケジュール
-- =============================================
create table if not exists class_templates (
  id             serial primary key,
  day_of_week    text    not null,  -- 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  start_time     text    not null,  -- '13:00'
  end_time       text    not null,  -- '14:30'
  title          text    not null,
  teacher        text    not null,
  color_type     text    not null default 'pink',  -- 'pink' | 'blue' | 'yellow'
  has_stretch    boolean not null default false,
  top_offset_pct numeric not null default 0,
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- =============================================
-- lesson_instances: 実際の1回ごとのレッスン
-- （休講・時間変更・リハーサルに対応）
-- =============================================
create table if not exists lesson_instances (
  id                serial primary key,
  class_template_id integer     not null references class_templates(id),
  lesson_date       date        not null,
  status            text        not null default 'regular',  -- 'regular' | 'cancelled' | 'time_changed' | 'rehearsal'
  actual_start_time text,        -- null = テンプレートの時間を使用
  actual_end_time   text,
  notes             text,
  created_by        integer references users(id),
  created_at        timestamptz not null default now(),
  unique (class_template_id, lesson_date)
);

-- =============================================
-- attendance: 出席記録
-- =============================================
create table if not exists attendance (
  id                 serial primary key,
  lesson_instance_id integer not null references lesson_instances(id),
  student_id         integer not null references users(id),
  attended           boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (lesson_instance_id, student_id)
);

-- =============================================
-- seed: class_templates に既存レッスンデータを投入
-- =============================================
insert into class_templates (day_of_week, start_time, end_time, title, teacher, color_type, has_stretch, top_offset_pct, sort_order) values
  ('Tue', '13:00', '14:30', 'バレエ入門',    '門馬和樹', 'pink',   true,  0,   1),
  ('Tue', '14:30', '15:05', 'プレモダン',    '門馬和樹', 'blue',   false, 0,   2),
  ('Tue', '19:30', '21:00', 'モダンバレエ',  '青山佳樹', 'blue',   true,  0,   3),
  ('Wed', '13:00', '14:30', 'バレエ基礎',    '門馬和樹', 'pink',   false, 0,   1),
  ('Wed', '15:00', '16:30', 'モダンバレエ',  '門馬和樹', 'blue',   false, 0,   2),
  ('Wed', '19:15', '20:45', 'バレエ入門基礎','青山佳樹', 'pink',   false, 0,   3),
  ('Thu', '13:00', '14:30', 'バレエ基礎',    '青山佳樹', 'pink',   false, 0,   1),
  ('Thu', '14:30', '15:05', 'ポワント',      '青山佳樹', 'yellow', false, 0,   2),
  ('Thu', '15:30', '17:00', 'モダンバレエ',  '青山佳樹', 'blue',   true,  0,   3),
  ('Thu', '19:30', '21:00', 'モダンバレエ',  '門馬和樹', 'blue',   true,  0,   4),
  ('Fri', '15:00', '16:30', 'バレエ入門',    '青山佳樹', 'pink',   true,  0,   1),
  ('Fri', '16:30', '17:05', 'ポワント',      '青山佳樹', 'yellow', false, 0,   2),
  ('Sat', '12:30', '14:00', 'バレエ入門基礎','門馬和樹', 'pink',   false, 3.4, 1),
  ('Sat', '14:30', '16:00', 'バレエ基礎',    '青山佳樹', 'pink',   false, 0,   2),
  ('Sat', '16:30', '18:00', 'モダンバレエ',  '青山佳樹', 'blue',   true,  0,   3),
  ('Sun', '12:30', '14:00', 'バレエ入門',    '青山佳樹', 'pink',   false, 3.4, 1),
  ('Sun', '14:30', '16:00', 'バレエ基礎',    '青山佳樹', 'pink',   false, 0,   2),
  ('Sun', '16:00', '16:35', 'ポワント',      '青山佳樹', 'yellow', false, 0,   3)
on conflict do nothing;

create table if not exists server_db_costs (
  id serial primary key,
  year_month text not null unique,
  amount integer not null,
  received_at date,
  note text,
  created_at timestamptz default now()
);

insert into server_db_costs (year_month, amount) values ('2026-07', 7587)
  on conflict (year_month) do nothing;

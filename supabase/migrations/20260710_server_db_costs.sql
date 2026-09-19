create table if not exists server_db_costs (
  id serial primary key,
  year_month text not null unique,
  amount integer not null,
  received_at date,
  note text,
  created_at timestamptz default now()
);

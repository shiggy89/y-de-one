alter table server_db_costs alter column amount drop not null;

insert into server_db_costs (year_month, amount, received_at) values ('2026-08', null, '2026-07-29')
  on conflict (year_month) do update set received_at = excluded.received_at;

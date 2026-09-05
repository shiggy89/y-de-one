insert into server_db_costs (year_month, amount) values ('2026-09', 7805)
  on conflict (year_month) do update set amount = excluded.amount;

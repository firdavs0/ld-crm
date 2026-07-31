-- Выполнить в Supabase: SQL Editor -> New query -> вставить и нажать Run

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- разрешаем чтение и запись всем, у кого есть anon-ключ проекта
-- (в этом сценарии это ок, т.к. вся команда работает с общими данными без логина)
alter table kv_store enable row level security;

create policy "allow read for anon" on kv_store
  for select using (true);

create policy "allow insert for anon" on kv_store
  for insert with check (true);

create policy "allow update for anon" on kv_store
  for update using (true);

create policy "allow delete for anon" on kv_store
  for delete using (true);

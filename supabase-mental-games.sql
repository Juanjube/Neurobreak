create table mental_game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  score integer,
  duration integer not null,
  variant_seed text not null,
  completed_at timestamptz not null default now()
);

alter table mental_game_history enable row level security;

create policy "Users can read own mental game history"
on mental_game_history for select
using (auth.uid() = user_id);

create policy "Users can insert own mental game history"
on mental_game_history for insert
with check (auth.uid() = user_id);

-- =====================================================================
-- BOLÃO COPA 2026 — Esquema do banco (PostgreSQL / Supabase)
-- Cole este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run
-- Idempotente o suficiente para rodar em projeto novo.
-- =====================================================================

-- ---------- Tipos ----------
do $$ begin
  create type round_code as enum ('group','r32','r16','qf','sf','third','final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('scheduled','live','finished');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 com auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'player' check (role in ('admin','player')),
  is_paid     boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- teams ----------
create table if not exists public.teams (
  id           text primary key,          -- id da API de futebol (string)
  name         text not null,
  code         text,                      -- sigla de 3 letras (ex.: BRA)
  flag_url     text,
  group_letter text                       -- A..L (null para times ainda indefinidos)
);

-- ---------- groups (A..L) ----------
create table if not exists public.groups (
  letter     text primary key,            -- 'A'..'L'
  deadline   timestamptz,                 -- kickoff do 1º jogo do grupo (fecha palpites)
  is_locked  boolean not null default false  -- fechamento manual do admin
);

-- Classificação OFICIAL final do grupo (posições 1..4)
create table if not exists public.group_standings (
  group_letter text primary key references public.groups(letter) on delete cascade,
  pos1_team_id text references public.teams(id),
  pos2_team_id text references public.teams(id),
  pos3_team_id text references public.teams(id),
  pos4_team_id text references public.teams(id),
  is_final     boolean not null default false,  -- true quando o grupo terminou
  updated_at   timestamptz not null default now()
);

-- ---------- matches (jogos do mata-mata; também guardam deadline/resultado) ----------
create table if not exists public.matches (
  id             text primary key,        -- id da fixture na API
  round          round_code not null,
  slot           text,                    -- rótulo do confronto no chaveamento (ex.: 'R32-1')
  home_team_id   text references public.teams(id),
  away_team_id   text references public.teams(id),
  kickoff        timestamptz,
  status         match_status not null default 'scheduled',
  home_score     int,
  away_score     int,
  winner_team_id text references public.teams(id),  -- quem AVANÇOU (pós prorrog/pênaltis)
  updated_at     timestamptz not null default now()
);

-- ---------- round_locks (deadline por rodada de mata-mata) ----------
create table if not exists public.round_locks (
  round      round_code primary key,
  deadline   timestamptz,                 -- kickoff do 1º jogo da rodada
  is_locked  boolean not null default false
);

-- ---------- settings (singleton) ----------
create table if not exists public.settings (
  id                int primary key default 1 check (id = 1),
  champion_deadline timestamptz,          -- antes do 1º jogo da Copa
  tournament_name   text not null default 'Copa do Mundo 2026',
  updated_at        timestamptz not null default now()
);

-- ========================= PALPITES =========================

-- Palpite de classificação de um grupo (ordem 1..4)
create table if not exists public.predictions_group (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  group_letter text not null references public.groups(letter) on delete cascade,
  pos1_team_id text not null references public.teams(id),
  pos2_team_id text not null references public.teams(id),
  pos3_team_id text not null references public.teams(id),
  pos4_team_id text not null references public.teams(id),
  points       int,                       -- calculado após o grupo terminar
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, group_letter)
);

-- Palpite de quem avança num jogo de mata-mata
create table if not exists public.predictions_match (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  match_id      text not null references public.matches(id) on delete cascade,
  picked_team_id text not null references public.teams(id),
  points        int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, match_id)
);

-- Palpite de campeão (pré-torneio) — 1 por usuário
create table if not exists public.predictions_champion (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  team_id    text not null references public.teams(id),
  points     int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================= VIEWS DE RANKING =========================

-- Pontos por usuário e por rodada (group/r32/.../final/champion)
create or replace view public.v_user_round_points as
  select user_id, 'group'::text as round, coalesce(sum(points),0) as points
    from public.predictions_group group by user_id
  union all
  select pm.user_id, m.round::text as round, coalesce(sum(pm.points),0) as points
    from public.predictions_match pm
    join public.matches m on m.id = pm.match_id
    group by pm.user_id, m.round
  union all
  select user_id, 'champion'::text as round, coalesce(sum(points),0) as points
    from public.predictions_champion group by user_id;

-- Pontuação total por usuário
create or replace view public.v_user_total_points as
  select p.id as user_id,
         p.full_name,
         p.avatar_url,
         p.is_paid,
         coalesce((
           select sum(points) from public.v_user_round_points r where r.user_id = p.id
         ), 0) as total_points
    from public.profiles p
   where p.is_active = true;

-- ========================= RLS =========================
alter table public.profiles            enable row level security;
alter table public.teams               enable row level security;
alter table public.groups              enable row level security;
alter table public.group_standings     enable row level security;
alter table public.matches             enable row level security;
alter table public.round_locks         enable row level security;
alter table public.settings            enable row level security;
alter table public.predictions_group   enable row level security;
alter table public.predictions_match   enable row level security;
alter table public.predictions_champion enable row level security;

-- Helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- Helper: o usuário atual pagou a taxa? (palpites só com pagamento confirmado)
create or replace function public.has_paid()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and is_paid = true and is_active = true
  );
$$;

-- ---- Leitura pública (autenticada) de dados do torneio ----
drop policy if exists "read teams"   on public.teams;
create policy "read teams" on public.teams for select to authenticated using (true);
drop policy if exists "read groups"  on public.groups;
create policy "read groups" on public.groups for select to authenticated using (true);
drop policy if exists "read standings" on public.group_standings;
create policy "read standings" on public.group_standings for select to authenticated using (true);
drop policy if exists "read matches" on public.matches;
create policy "read matches" on public.matches for select to authenticated using (true);
drop policy if exists "read locks"   on public.round_locks;
create policy "read locks" on public.round_locks for select to authenticated using (true);
drop policy if exists "read settings" on public.settings;
create policy "read settings" on public.settings for select to authenticated using (true);

-- ---- profiles: cada um lê todos (ranking), edita só o próprio (sem trocar papel) ----
drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- predictions_group: dono lê/escreve o próprio enquanto o grupo NÃO estiver fechado ----
drop policy if exists "own group preds select" on public.predictions_group;
create policy "own group preds select" on public.predictions_group for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own group preds write" on public.predictions_group;
create policy "own group preds write" on public.predictions_group for all to authenticated
  using (user_id = auth.uid() and public.has_paid())
  with check (
    user_id = auth.uid()
    and public.has_paid()
    and not exists (
      select 1 from public.groups g
       where g.letter = group_letter
         and (g.is_locked = true or (g.deadline is not null and g.deadline <= now()))
    )
  );

-- ---- predictions_match: idem, travado pela rodada ----
drop policy if exists "own match preds select" on public.predictions_match;
create policy "own match preds select" on public.predictions_match for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own match preds write" on public.predictions_match;
create policy "own match preds write" on public.predictions_match for all to authenticated
  using (user_id = auth.uid() and public.has_paid())
  with check (
    user_id = auth.uid()
    and public.has_paid()
    and exists (
      select 1
        from public.matches m
        join public.round_locks rl on rl.round = m.round
       where m.id = match_id
         and rl.is_locked = false
         and (rl.deadline is null or rl.deadline > now())
    )
  );

-- ---- predictions_champion: travado pelo champion_deadline ----
drop policy if exists "own champion select" on public.predictions_champion;
create policy "own champion select" on public.predictions_champion for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own champion write" on public.predictions_champion;
create policy "own champion write" on public.predictions_champion for all to authenticated
  using (user_id = auth.uid() and public.has_paid())
  with check (
    user_id = auth.uid()
    and public.has_paid()
    and exists (
      select 1 from public.settings s
       where s.id = 1
         and (s.champion_deadline is null or s.champion_deadline > now())
    )
  );

-- Observação: a leitura dos palpites ALHEIOS (após o fechamento) e o cálculo de
-- pontos são feitos no servidor com a chave service_role, que ignora o RLS e
-- aplica a checagem de deadline em código (ver src/lib e rotas /api).

-- ---------- Trigger: cria profile no signup e aplica papel de admin ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'player'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

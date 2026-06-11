-- =====================================================================
-- BOLÃO COPA 2026 — Dados iniciais (estrutura do torneio)
-- Rode DEPOIS do schema.sql. Times, jogos e resultados vêm da API (sync).
-- =====================================================================

-- Configuração geral (singleton). champion_deadline é ajustado pelo sync
-- para o kickoff real do jogo de abertura; aqui fica um padrão seguro.
insert into public.settings (id, champion_deadline, tournament_name)
values (1, '2026-06-11 20:00:00+00', 'Copa do Mundo 2026')
on conflict (id) do update set tournament_name = excluded.tournament_name;

-- 12 grupos (A..L). deadline é preenchido pelo sync (kickoff do 1º jogo do grupo).
insert into public.groups (letter) values
  ('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J'),('K'),('L')
on conflict (letter) do nothing;

-- Linhas de classificação (vazias até o grupo terminar)
insert into public.group_standings (group_letter) values
  ('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J'),('K'),('L')
on conflict (group_letter) do nothing;

-- Rodadas do mata-mata (deadline preenchido pelo sync)
insert into public.round_locks (round) values
  ('r32'),('r16'),('qf'),('sf'),('third'),('final')
on conflict (round) do nothing;

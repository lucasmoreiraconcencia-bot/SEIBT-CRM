-- =====================================================================
-- MIGRAÇÃO: trava de pagamento nos palpites
-- Rode este script no Supabase (SQL Editor > New query > Run).
-- Só quem estiver marcado como PAGO consegue salvar/editar palpites.
-- =====================================================================

-- Helper: o usuário atual pagou a taxa?
create or replace function public.has_paid()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and is_paid = true and is_active = true
  );
$$;

-- ---- predictions_group ----
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

-- ---- predictions_match ----
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

-- ---- predictions_champion ----
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

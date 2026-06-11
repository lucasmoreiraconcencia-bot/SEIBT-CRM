// =====================================================================
// Recálculo de pontos — roda no SERVIDOR com service role.
// Usa as funções puras de scoring.ts e grava os pontos nos palpites.
// Palpite ausente não gera linha => conta como 0 (regra: 0 ponto automático).
// =====================================================================

import { createAdminClient } from "./supabase/admin";
import {
  scoreGroupPrediction,
  scoreMatchPrediction,
  scoreChampionPrediction,
  type GroupOrder,
} from "./scoring";

export interface ScoreResult {
  groupsScored: number;
  matchesScored: number;
  championScored: number;
}

export async function recomputeAllPoints(): Promise<ScoreResult> {
  const db = createAdminClient();

  // ---- 1. Classificações oficiais finais ----
  const { data: standings } = await db
    .from("group_standings")
    .select("*")
    .eq("is_final", true);

  const officialByGroup = new Map<string, GroupOrder>();
  for (const s of standings ?? []) {
    if (s.pos1_team_id && s.pos2_team_id && s.pos3_team_id && s.pos4_team_id) {
      officialByGroup.set(s.group_letter, {
        pos1_team_id: s.pos1_team_id,
        pos2_team_id: s.pos2_team_id,
        pos3_team_id: s.pos3_team_id,
        pos4_team_id: s.pos4_team_id,
      });
    }
  }

  // ---- 2. Pontuar palpites de grupo ----
  let groupsScored = 0;
  const { data: groupPreds } = await db.from("predictions_group").select("*");
  for (const p of groupPreds ?? []) {
    const official = officialByGroup.get(p.group_letter);
    if (!official) continue; // grupo ainda não encerrado
    const { total } = scoreGroupPrediction(
      {
        pos1_team_id: p.pos1_team_id,
        pos2_team_id: p.pos2_team_id,
        pos3_team_id: p.pos3_team_id,
        pos4_team_id: p.pos4_team_id,
      },
      official,
    );
    await db.from("predictions_group").update({ points: total }).eq("id", p.id);
    groupsScored++;
  }

  // ---- 3. Pontuar palpites de mata-mata ----
  const { data: matches } = await db
    .from("matches")
    .select("id, round, winner_team_id, status");
  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));

  let matchesScored = 0;
  const { data: matchPreds } = await db.from("predictions_match").select("*");
  for (const p of matchPreds ?? []) {
    const m = matchById.get(p.match_id);
    if (!m || m.round === "group") continue;
    const pts = scoreMatchPrediction(
      p.picked_team_id,
      m.winner_team_id,
      m.round,
    );
    await db.from("predictions_match").update({ points: pts }).eq("id", p.id);
    matchesScored++;
  }

  // ---- 4. Pontuar palpite de campeão ----
  // Campeão = vencedor da partida final encerrada.
  const finalMatch = (matches ?? []).find(
    (m) => m.round === "final" && m.status === "finished" && m.winner_team_id,
  );
  const championId = finalMatch?.winner_team_id ?? null;

  let championScored = 0;
  const { data: champPreds } = await db
    .from("predictions_champion")
    .select("*");
  for (const p of champPreds ?? []) {
    const pts = scoreChampionPrediction(p.team_id, championId);
    await db
      .from("predictions_champion")
      .update({ points: pts })
      .eq("user_id", p.user_id);
    championScored++;
  }

  return { groupsScored, matchesScored, championScored };
}

// =====================================================================
// Sincronização com a API de futebol -> banco (service role).
// Upsert de times, jogos, deadlines, classificações e campeão.
// =====================================================================

import { createAdminClient } from "./supabase/admin";
import { fetchFixtures, fetchStandings, type ApiFixture } from "./football-api";
import { earliestKickoff } from "./deadlines";
import { recomputeAllPoints } from "./score";
import type { RoundCode } from "./types";

export interface SyncResult {
  teams: number;
  matches: number;
  groupsWithDeadline: number;
  roundsWithDeadline: number;
  standingsFinalized: number;
  scored: Awaited<ReturnType<typeof recomputeAllPoints>>;
}

export async function syncFromApi(): Promise<SyncResult> {
  const db = createAdminClient();
  const [fixtures, standingsData] = await Promise.all([
    fetchFixtures(),
    fetchStandings().catch(() => [] as Awaited<ReturnType<typeof fetchStandings>>),
  ]);

  // ---- Times (deduplicados) ----
  const teamMap = new Map<
    string,
    { id: string; name: string; flag_url: string | null; group_letter: string | null }
  >();
  for (const f of fixtures) {
    for (const side of [f.home, f.away]) {
      const existing = teamMap.get(side.id);
      teamMap.set(side.id, {
        id: side.id,
        name: side.name,
        flag_url: side.logo,
        // grupo só é definido pelos jogos da fase de grupos
        group_letter: f.groupLetter ?? existing?.group_letter ?? null,
      });
    }
  }
  // Preenche group_letter via standings (mais confiável que o campo group das fixtures)
  for (const row of standingsData) {
    const t = teamMap.get(row.teamId);
    if (t) t.group_letter = row.groupLetter;
    else teamMap.set(row.teamId, {
      id: row.teamId,
      name: row.teamName,
      flag_url: row.logo,
      group_letter: row.groupLetter,
    });
  }

  const teams = [...teamMap.values()];
  if (teams.length) {
    await db.from("teams").upsert(teams, { onConflict: "id" });
  }

  // ---- Jogos (todas as rodadas reconhecidas) ----
  const matchRows = fixtures
    .filter((f) => f.round !== null)
    .map((f) => ({
      id: f.id,
      round: f.round as RoundCode,
      slot: f.rawRound,
      home_team_id: f.home.id,
      away_team_id: f.away.id,
      kickoff: f.kickoff,
      status: f.status,
      home_score: f.homeScore,
      away_score: f.awayScore,
      winner_team_id: resolveWinner(f),
      updated_at: new Date().toISOString(),
    }));
  if (matchRows.length) {
    await db.from("matches").upsert(matchRows, { onConflict: "id" });
  }

  // ---- Deadlines por grupo (kickoff do 1º jogo do grupo) ----
  const groupKickoffs = new Map<string, string[]>();
  for (const f of fixtures) {
    if (f.round === "group" && f.groupLetter) {
      const arr = groupKickoffs.get(f.groupLetter) ?? [];
      arr.push(f.kickoff);
      groupKickoffs.set(f.groupLetter, arr);
    }
  }
  let groupsWithDeadline = 0;
  for (const [letter, kicks] of groupKickoffs) {
    const deadline = earliestKickoff(kicks);
    await db.from("groups").update({ deadline }).eq("letter", letter);
    groupsWithDeadline++;
  }

  // ---- Deadlines por rodada de mata-mata ----
  const roundKickoffs = new Map<RoundCode, string[]>();
  for (const f of fixtures) {
    if (f.round && f.round !== "group") {
      const arr = roundKickoffs.get(f.round) ?? [];
      arr.push(f.kickoff);
      roundKickoffs.set(f.round, arr);
    }
  }
  let roundsWithDeadline = 0;
  for (const [round, kicks] of roundKickoffs) {
    const deadline = earliestKickoff(kicks);
    await db.from("round_locks").update({ deadline }).eq("round", round);
    roundsWithDeadline++;
  }

  // ---- Deadline do palpite de campeão (1º jogo da Copa) ----
  const championDeadline = earliestKickoff(fixtures.map((f) => f.kickoff));
  if (championDeadline) {
    await db
      .from("settings")
      .update({ champion_deadline: championDeadline, updated_at: new Date().toISOString() })
      .eq("id", 1);
  }

  // ---- Classificação final dos grupos ----
  let standingsFinalized = 0;
  try {
    const standings = standingsData;
    // Conta jogos encerrados por grupo para saber se o grupo terminou.
    const finishedByGroup = new Map<string, number>();
    for (const f of fixtures) {
      if (f.round === "group" && f.groupLetter && f.status === "finished") {
        finishedByGroup.set(
          f.groupLetter,
          (finishedByGroup.get(f.groupLetter) ?? 0) + 1,
        );
      }
    }
    const byGroup = new Map<string, typeof standings>();
    for (const row of standings) {
      const arr = byGroup.get(row.groupLetter) ?? [];
      arr.push(row);
      byGroup.set(row.groupLetter, arr);
    }
    for (const [letter, rows] of byGroup) {
      const ordered = [...rows].sort((a, b) => a.rank - b.rank);
      if (ordered.length < 4) continue;
      // Grupo de 4 times => 6 jogos. Final quando todos encerrados.
      const isFinal = (finishedByGroup.get(letter) ?? 0) >= 6;
      await db.from("group_standings").upsert(
        {
          group_letter: letter,
          pos1_team_id: ordered[0].teamId,
          pos2_team_id: ordered[1].teamId,
          pos3_team_id: ordered[2].teamId,
          pos4_team_id: ordered[3].teamId,
          is_final: isFinal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_letter" },
      );
      if (isFinal) standingsFinalized++;
    }
  } catch {
    // Standings podem não existir ainda no começo do torneio — ignora.
  }

  // ---- Recalcula pontos ----
  const scored = await recomputeAllPoints();

  return {
    teams: teams.length,
    matches: matchRows.length,
    groupsWithDeadline,
    roundsWithDeadline,
    standingsFinalized,
    scored,
  };
}

// Quem avançou: a API marca teams.home.winner / away.winner.
function resolveWinner(f: ApiFixture): string | null {
  if (f.home.winner === true) return f.home.id;
  if (f.away.winner === true) return f.away.id;
  return null;
}

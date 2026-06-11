// =====================================================================
// Integração com football-data.org (plano gratuito cobre Copa 2026).
// Documentação: https://www.football-data.org/documentation/quickstart
// SERVIDOR APENAS — usa FOOTBALL_API_KEY (sem NEXT_PUBLIC).
// =====================================================================

import type { RoundCode } from "./types";

const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

function apiKey(): string {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) throw new Error("FOOTBALL_API_KEY não configurada.");
  return key;
}

async function apiGet(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": apiKey() },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org ${path} respondeu ${res.status}: ${text}`);
  }
  return res.json();
}

function mapStage(stage: string): RoundCode | null {
  switch (stage) {
    case "GROUP_STAGE":   return "group";
    case "ROUND_OF_32":   return "r32";
    case "ROUND_OF_16":   return "r16";
    case "QUARTER_FINALS": return "qf";
    case "SEMI_FINALS":   return "sf";
    case "THIRD_PLACE":   return "third";
    case "FINAL":         return "final";
    default:              return null;
  }
}

function mapGroupLetter(group: string | null): string | null {
  if (!group) return null;
  const upper = group.toUpperCase();
  // "GROUP_A", "GROUP A", "Group A", "GROUP-A", etc.
  const withWord = upper.match(/GROUP[^A-Z]*([A-L])/);
  if (withWord) return withWord[1];
  // bare letter: "A" through "L"
  const bare = upper.match(/^([A-L])$/);
  return bare ? bare[1] : null;
}

function mapStatus(status: string): "scheduled" | "live" | "finished" {
  if (status === "FINISHED") return "finished";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "live";
  return "scheduled";
}

export interface ApiFixture {
  id: string;
  round: RoundCode | null;
  rawRound: string;
  groupLetter: string | null;
  kickoff: string;
  status: "scheduled" | "live" | "finished";
  home: { id: string; name: string; logo: string | null; winner: boolean | null };
  away: { id: string; name: string; logo: string | null; winner: boolean | null };
  homeScore: number | null;
  awayScore: number | null;
}

export async function fetchFixtures(): Promise<ApiFixture[]> {
  const json = await apiGet(`/competitions/${COMPETITION}/matches`);
  const matches: any[] = json.matches ?? [];

  return matches.map((m) => {
    const stage: string = m.stage ?? "";
    const group: string | null = m.group ?? null;
    const winner: string | null = m.score?.winner ?? null;

    return {
      id: String(m.id),
      round: mapStage(stage),
      rawRound: group ?? stage,
      groupLetter: mapGroupLetter(group),
      kickoff: m.utcDate,
      status: mapStatus(m.status ?? "SCHEDULED"),
      home: {
        id: String(m.homeTeam.id),
        name: m.homeTeam.name ?? m.homeTeam.shortName ?? "TBD",
        logo: m.homeTeam.crest ?? null,
        winner: winner === "HOME_TEAM" ? true : winner === "AWAY_TEAM" ? false : null,
      },
      away: {
        id: String(m.awayTeam.id),
        name: m.awayTeam.name ?? m.awayTeam.shortName ?? "TBD",
        logo: m.awayTeam.crest ?? null,
        winner: winner === "AWAY_TEAM" ? true : winner === "HOME_TEAM" ? false : null,
      },
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
    };
  });
}

export interface ApiStandingRow {
  groupLetter: string;
  rank: number;
  teamId: string;
  teamName: string;
  logo: string | null;
}

export async function fetchStandings(): Promise<ApiStandingRow[]> {
  const json = await apiGet(`/competitions/${COMPETITION}/standings`);
  const standings: any[] = json.standings ?? [];

  const rows: ApiStandingRow[] = [];
  for (const standing of standings) {
    if (standing.type !== "TOTAL") continue;
    const groupLetter = mapGroupLetter(standing.group ?? "");
    if (!groupLetter) continue;
    for (const entry of standing.table ?? []) {
      rows.push({
        groupLetter,
        rank: entry.position,
        teamId: String(entry.team.id),
        teamName: entry.team.name,
        logo: entry.team.crest ?? null,
      });
    }
  }
  return rows;
}

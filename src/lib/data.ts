// =====================================================================
// Acesso a dados para Server Components (usa service role — SERVIDOR APENAS).
// A regra de "revelar palpites alheios só após o fechamento" é aplicada
// nas PÁGINAS, que checam o lock antes de renderizar dados de terceiros.
// =====================================================================

// NÃO importar em componentes client (usa service role).
import { createAdminClient } from "./supabase/admin";
import type {
  Settings,
  Team,
  Group,
  GroupStanding,
  Match,
  RoundLock,
  UserTotalPoints,
  UserRoundPoints,
  PredictionGroup,
  PredictionMatch,
  PredictionChampion,
  Profile,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getSettings(): Promise<Settings | null> {
  const { data } = await db().from("settings").select("*").eq("id", 1).single();
  return (data as Settings) ?? null;
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await db().from("teams").select("*").order("name");
  return (data as Team[]) ?? [];
}

export async function getTeamsByGroup(): Promise<Map<string, Team[]>> {
  const teams = await getTeams();
  const map = new Map<string, Team[]>();
  for (const t of teams) {
    if (!t.group_letter) continue;
    const arr = map.get(t.group_letter) ?? [];
    arr.push(t);
    map.set(t.group_letter, arr);
  }
  return map;
}

export async function getGroups(): Promise<Group[]> {
  const { data } = await db().from("groups").select("*").order("letter");
  return (data as Group[]) ?? [];
}

export async function getStandings(): Promise<GroupStanding[]> {
  const { data } = await db().from("group_standings").select("*");
  return (data as GroupStanding[]) ?? [];
}

export async function getMatches(): Promise<Match[]> {
  const { data } = await db()
    .from("matches")
    .select("*")
    .order("kickoff", { ascending: true });
  return (data as Match[]) ?? [];
}

export async function getRoundLocks(): Promise<RoundLock[]> {
  const { data } = await db().from("round_locks").select("*");
  return (data as RoundLock[]) ?? [];
}

export async function getRankingTotals(): Promise<UserTotalPoints[]> {
  const { data } = await db()
    .from("v_user_total_points")
    .select("*")
    .order("total_points", { ascending: false });
  return (data as UserTotalPoints[]) ?? [];
}

export async function getRoundPoints(): Promise<UserRoundPoints[]> {
  const { data } = await db().from("v_user_round_points").select("*");
  return (data as UserRoundPoints[]) ?? [];
}

// ---- Palpites do próprio usuário ----
export async function getMyGroupPreds(userId: string): Promise<PredictionGroup[]> {
  const { data } = await db()
    .from("predictions_group")
    .select("*")
    .eq("user_id", userId);
  return (data as PredictionGroup[]) ?? [];
}

export async function getMyMatchPreds(userId: string): Promise<PredictionMatch[]> {
  const { data } = await db()
    .from("predictions_match")
    .select("*")
    .eq("user_id", userId);
  return (data as PredictionMatch[]) ?? [];
}

export async function getMyChampion(userId: string): Promise<PredictionChampion | null> {
  const { data } = await db()
    .from("predictions_champion")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as PredictionChampion) ?? null;
}

// ---- Palpites de TODOS (só usar em páginas após o fechamento da fase) ----
export interface WithUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export async function getAllGroupPreds(
  groupLetter: string,
): Promise<(PredictionGroup & WithUser)[]> {
  const { data } = await db()
    .from("predictions_group")
    .select("*, profiles!inner(full_name, avatar_url)")
    .eq("group_letter", groupLetter);
  return flatten(data);
}

export async function getAllMatchPreds(
  matchId: string,
): Promise<(PredictionMatch & WithUser)[]> {
  const { data } = await db()
    .from("predictions_match")
    .select("*, profiles!inner(full_name, avatar_url)")
    .eq("match_id", matchId);
  return flatten(data);
}

export async function getAllGroupPredsAll(): Promise<
  (PredictionGroup & WithUser)[]
> {
  const { data } = await db()
    .from("predictions_group")
    .select("*, profiles!inner(full_name, avatar_url)");
  return flatten(data);
}

export async function getAllMatchPredsAll(): Promise<
  (PredictionMatch & WithUser)[]
> {
  const { data } = await db()
    .from("predictions_match")
    .select("*, profiles!inner(full_name, avatar_url)");
  return flatten(data);
}

export async function getAllChampionPreds(): Promise<
  (PredictionChampion & WithUser)[]
> {
  const { data } = await db()
    .from("predictions_champion")
    .select("*, profiles!inner(full_name, avatar_url)");
  return flatten(data);
}

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await db()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as Profile[]) ?? [];
}

// Achata o join com profiles em campos planos (full_name, avatar_url).
function flatten(rows: any[] | null): any[] {
  return (rows ?? []).map((r) => {
    const { profiles, ...rest } = r;
    return {
      ...rest,
      full_name: profiles?.full_name ?? null,
      avatar_url: profiles?.avatar_url ?? null,
    };
  });
}

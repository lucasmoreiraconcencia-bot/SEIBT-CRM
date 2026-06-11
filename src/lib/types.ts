// Tipos compartilhados — espelham as tabelas do banco (supabase/schema.sql)

export type RoundCode = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type ChampionRound = "champion";
export type RankingRound = RoundCode | ChampionRound;

export type MatchStatus = "scheduled" | "live" | "finished";
export type Role = "admin" | "player";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_paid: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  code: string | null;
  flag_url: string | null;
  group_letter: string | null;
}

export interface Group {
  letter: string;
  deadline: string | null;
  is_locked: boolean;
}

export interface GroupStanding {
  group_letter: string;
  pos1_team_id: string | null;
  pos2_team_id: string | null;
  pos3_team_id: string | null;
  pos4_team_id: string | null;
  is_final: boolean;
  updated_at: string;
}

export interface Match {
  id: string;
  round: RoundCode;
  slot: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  kickoff: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  updated_at: string;
}

export interface RoundLock {
  round: RoundCode;
  deadline: string | null;
  is_locked: boolean;
}

export interface Settings {
  id: number;
  champion_deadline: string | null;
  tournament_name: string;
  updated_at: string;
}

export interface PredictionGroup {
  id: string;
  user_id: string;
  group_letter: string;
  pos1_team_id: string;
  pos2_team_id: string;
  pos3_team_id: string;
  pos4_team_id: string;
  points: number | null;
}

export interface PredictionMatch {
  id: string;
  user_id: string;
  match_id: string;
  picked_team_id: string;
  points: number | null;
}

export interface PredictionChampion {
  user_id: string;
  team_id: string;
  points: number | null;
}

export interface UserTotalPoints {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_paid: boolean;
  total_points: number;
}

export interface UserRoundPoints {
  user_id: string;
  round: RankingRound;
  points: number;
}

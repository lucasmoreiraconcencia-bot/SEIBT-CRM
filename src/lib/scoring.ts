// =====================================================================
// Motor de pontuação — FUNÇÕES PURAS (sem I/O), 100% testáveis.
// Esta é a fonte única da verdade das regras de pontos do bolão.
// Ver tests/scoring.test.ts
// =====================================================================

import type { RoundCode } from "./types";

/** Pontos por acertar cada posição na classificação do grupo. */
export const GROUP_POSITION_POINTS: Record<1 | 2 | 3 | 4, number> = {
  1: 5,
  2: 3,
  3: 2,
  4: 0,
};

/** Pontos por acertar quem avança/vence em cada rodada do mata-mata. */
export const ROUND_POINTS: Record<Exclude<RoundCode, "group">, number> = {
  r32: 3, // Rodada de 32
  r16: 3, // Oitavas
  qf: 3, // Quartas
  sf: 5, // Semifinais
  third: 10, // Disputa de 3º lugar
  final: 20, // Final (campeão)
};

/** Pontos por acertar o campeão no palpite pré-torneio. */
export const CHAMPION_POINTS = 40;

/** Nomes amigáveis das rodadas (PT-BR). */
export const ROUND_LABELS: Record<RoundCode | "champion", string> = {
  group: "Fase de Grupos",
  r32: "Rodada de 32",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third: "Disputa de 3º Lugar",
  final: "Final",
  champion: "Palpite de Campeão",
};

/** Ordem de exibição das rodadas. */
export const ROUND_ORDER: (RoundCode | "champion")[] = [
  "champion",
  "group",
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export interface GroupOrder {
  pos1_team_id: string;
  pos2_team_id: string;
  pos3_team_id: string;
  pos4_team_id: string;
}

export interface GroupScoreBreakdown {
  pos1: boolean;
  pos2: boolean;
  pos3: boolean;
  pos4: boolean;
  total: number;
}

/**
 * Compara o palpite de classificação de um grupo com o resultado oficial.
 * Pontua cada posição acertada independentemente (1º=5, 2º=3, 3º=2, 4º=0).
 */
export function scoreGroupPrediction(
  predicted: GroupOrder,
  official: GroupOrder,
): GroupScoreBreakdown {
  const pos1 = predicted.pos1_team_id === official.pos1_team_id;
  const pos2 = predicted.pos2_team_id === official.pos2_team_id;
  const pos3 = predicted.pos3_team_id === official.pos3_team_id;
  const pos4 = predicted.pos4_team_id === official.pos4_team_id;
  const total =
    (pos1 ? GROUP_POSITION_POINTS[1] : 0) +
    (pos2 ? GROUP_POSITION_POINTS[2] : 0) +
    (pos3 ? GROUP_POSITION_POINTS[3] : 0) +
    (pos4 ? GROUP_POSITION_POINTS[4] : 0);
  return { pos1, pos2, pos3, pos4, total };
}

/**
 * Pontua o palpite de quem avança/vence num jogo de mata-mata.
 * Vale quem AVANÇOU (independe de prorrogação/pênaltis).
 */
export function scoreMatchPrediction(
  pickedTeamId: string,
  winnerTeamId: string | null,
  round: Exclude<RoundCode, "group">,
): number {
  if (!winnerTeamId) return 0;
  return pickedTeamId === winnerTeamId ? ROUND_POINTS[round] : 0;
}

/** Pontua o palpite de campeão pré-torneio. */
export function scoreChampionPrediction(
  pickedTeamId: string,
  actualChampionTeamId: string | null,
): number {
  if (!actualChampionTeamId) return 0;
  return pickedTeamId === actualChampionTeamId ? CHAMPION_POINTS : 0;
}

/** Máximo de pontos possível por grupo (todas as posições corretas). */
export const MAX_GROUP_POINTS =
  GROUP_POSITION_POINTS[1] +
  GROUP_POSITION_POINTS[2] +
  GROUP_POSITION_POINTS[3] +
  GROUP_POSITION_POINTS[4];

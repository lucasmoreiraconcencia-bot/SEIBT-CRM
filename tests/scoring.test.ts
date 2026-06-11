import { describe, it, expect } from "vitest";
import {
  scoreGroupPrediction,
  scoreMatchPrediction,
  scoreChampionPrediction,
  MAX_GROUP_POINTS,
  GROUP_POSITION_POINTS,
  ROUND_POINTS,
  CHAMPION_POINTS,
} from "@/lib/scoring";

const official = {
  pos1_team_id: "BRA",
  pos2_team_id: "ARG",
  pos3_team_id: "GER",
  pos4_team_id: "FRA",
};

describe("scoreGroupPrediction", () => {
  it("acerto total soma 5+3+2+0 = 10", () => {
    const r = scoreGroupPrediction(official, official);
    expect(r.total).toBe(10);
    expect(r).toMatchObject({ pos1: true, pos2: true, pos3: true, pos4: true });
    expect(MAX_GROUP_POINTS).toBe(10);
  });

  it("acertar só o 1º vale 5", () => {
    const pred = { ...official, pos2_team_id: "X", pos3_team_id: "Y", pos4_team_id: "Z" };
    expect(scoreGroupPrediction(pred, official).total).toBe(5);
  });

  it("acertar só o 2º vale 3", () => {
    const pred = { ...official, pos1_team_id: "X", pos3_team_id: "Y", pos4_team_id: "Z" };
    expect(scoreGroupPrediction(pred, official).total).toBe(3);
  });

  it("acertar só o 3º vale 2", () => {
    const pred = { ...official, pos1_team_id: "X", pos2_team_id: "Y", pos4_team_id: "Z" };
    expect(scoreGroupPrediction(pred, official).total).toBe(2);
  });

  it("acertar só o 4º vale 0 (sem pontos)", () => {
    const pred = { pos1_team_id: "X", pos2_team_id: "Y", pos3_team_id: "Z", pos4_team_id: "FRA" };
    const r = scoreGroupPrediction(pred, official);
    expect(r.pos4).toBe(true);
    expect(r.total).toBe(0);
  });

  it("errar tudo vale 0", () => {
    const pred = { pos1_team_id: "W", pos2_team_id: "X", pos3_team_id: "Y", pos4_team_id: "Z" };
    expect(scoreGroupPrediction(pred, official).total).toBe(0);
  });

  it("1º + 3º = 7", () => {
    const pred = { ...official, pos2_team_id: "X", pos4_team_id: "Z" };
    expect(scoreGroupPrediction(pred, official).total).toBe(7);
  });
});

describe("scoreMatchPrediction", () => {
  it("Rodada de 32: acerto vale 3", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "r32")).toBe(3);
  });
  it("Oitavas: acerto vale 3", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "r16")).toBe(3);
  });
  it("Quartas: acerto vale 3", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "qf")).toBe(3);
  });
  it("Semi: acerto vale 5", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "sf")).toBe(5);
  });
  it("3º lugar: acerto vale 10", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "third")).toBe(10);
  });
  it("Final: acerto vale 20", () => {
    expect(scoreMatchPrediction("BRA", "BRA", "final")).toBe(20);
  });
  it("erro vale 0", () => {
    expect(scoreMatchPrediction("ARG", "BRA", "sf")).toBe(0);
  });
  it("sem vencedor definido vale 0", () => {
    expect(scoreMatchPrediction("BRA", null, "final")).toBe(0);
  });
});

describe("scoreChampionPrediction", () => {
  it("acertar o campeão vale 40", () => {
    expect(scoreChampionPrediction("BRA", "BRA")).toBe(CHAMPION_POINTS);
    expect(CHAMPION_POINTS).toBe(40);
  });
  it("errar o campeão vale 0", () => {
    expect(scoreChampionPrediction("ARG", "BRA")).toBe(0);
  });
  it("campeão ainda indefinido vale 0", () => {
    expect(scoreChampionPrediction("BRA", null)).toBe(0);
  });
});

describe("tabela de pontos (sanidade)", () => {
  it("posições do grupo", () => {
    expect(GROUP_POSITION_POINTS).toEqual({ 1: 5, 2: 3, 3: 2, 4: 0 });
  });
  it("rodadas do mata-mata", () => {
    expect(ROUND_POINTS).toEqual({ r32: 3, r16: 3, qf: 3, sf: 5, third: 10, final: 20 });
  });
});

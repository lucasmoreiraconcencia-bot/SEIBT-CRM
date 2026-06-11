"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncFromApi } from "@/lib/sync";
import { recomputeAllPoints } from "@/lib/score";
import type { RoundCode } from "@/lib/types";

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/resultados");
  revalidatePath("/ranking");
  revalidatePath("/palpites");
}

/** Marca/desmarca pagamento da taxa de um participante. */
export async function setPaid(userId: string, isPaid: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("profiles").update({ is_paid: isPaid }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/participantes");
  return { ok: true };
}

/** Remove (desativa) ou reativa um participante. */
export async function setActive(userId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Trava/destrava manualmente uma rodada de mata-mata. */
export async function lockRound(round: RoundCode, locked: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("round_locks").update({ is_locked: locked }).eq("round", round);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Trava/destrava manualmente um grupo. */
export async function lockGroup(letter: string, locked: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("groups").update({ is_locked: locked }).eq("letter", letter);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Corrige manualmente o vencedor (quem avançou) de um jogo e recalcula pontos. */
export async function overrideMatchWinner(
  matchId: string,
  winnerTeamId: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("matches")
    .update({
      winner_team_id: winnerTeamId,
      status: "finished",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (error) return { error: error.message };
  await recomputeAllPoints();
  revalidateAll();
  return { ok: true };
}

/** Corrige manualmente a classificação final de um grupo e recalcula pontos. */
export async function overrideGroupStanding(
  letter: string,
  order: [string, string, string, string],
  isFinal: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (new Set(order).size !== 4) return { error: "Informe 4 seleções diferentes." };
  const db = createAdminClient();
  const { error } = await db.from("group_standings").upsert(
    {
      group_letter: letter,
      pos1_team_id: order[0],
      pos2_team_id: order[1],
      pos3_team_id: order[2],
      pos4_team_id: order[3],
      is_final: isFinal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_letter" },
  );
  if (error) return { error: error.message };
  await recomputeAllPoints();
  revalidateAll();
  return { ok: true };
}

/** Dispara a sincronização com a API de futebol. */
export async function runSync(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const r = await syncFromApi();
    return {
      ok: true,
      message: `Sincronizado: ${r.teams} times, ${r.matches} jogos, ${r.standingsFinalized} grupos encerrados.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha na sincronização." };
  }
}

/** Recalcula todos os pontos (sem chamar a API). */
export async function runScore(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const r = await recomputeAllPoints();
    revalidateAll();
    return {
      ok: true,
      message: `Pontos recalculados: ${r.groupsScored} grupos, ${r.matchesScored} jogos, ${r.championScored} campeão.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao recalcular." };
  }
}

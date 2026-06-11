"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

const PAYMENT_ERROR =
  "Pagamento pendente — seus palpites serão liberados quando o administrador confirmar o pagamento.";

/** Retorna mensagem de erro se o usuário ainda não foi marcado como pago. */
async function checkPaid(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("is_paid, is_active")
    .eq("id", userId)
    .single();
  if (!data?.is_paid || !data?.is_active) return PAYMENT_ERROR;
  return null;
}

/** Salva (ou atualiza) o palpite de classificação de um grupo. */
export async function saveGroupPrediction(
  groupLetter: string,
  order: [string, string, string, string],
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const paymentError = await checkPaid(supabase, user.id);
  if (paymentError) return { error: paymentError };

  if (new Set(order).size !== 4) {
    return { error: "Escolha 4 seleções diferentes (uma por posição)." };
  }

  const { error } = await supabase.from("predictions_group").upsert(
    {
      user_id: user.id,
      group_letter: groupLetter,
      pos1_team_id: order[0],
      pos2_team_id: order[1],
      pos3_team_id: order[2],
      pos4_team_id: order[3],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,group_letter" },
  );

  if (error) {
    return { error: "Palpite fechado ou inválido. Verifique o prazo do grupo." };
  }
  revalidatePath("/palpites/grupos");
  revalidatePath("/palpites");
  return { ok: true };
}

/** Salva o palpite de quem avança/vence num jogo de mata-mata. */
export async function saveMatchPrediction(
  matchId: string,
  pickedTeamId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const paymentError = await checkPaid(supabase, user.id);
  if (paymentError) return { error: paymentError };

  const { error } = await supabase.from("predictions_match").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      picked_team_id: pickedTeamId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { error: "Palpite fechado ou inválido. Verifique o prazo da rodada." };
  }
  revalidatePath("/palpites/mata-mata");
  revalidatePath("/palpites");
  return { ok: true };
}

/** Salva o palpite de campeão (pré-torneio). */
export async function saveChampionPrediction(
  teamId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const paymentError = await checkPaid(supabase, user.id);
  if (paymentError) return { error: paymentError };

  const { error } = await supabase.from("predictions_champion").upsert(
    {
      user_id: user.id,
      team_id: teamId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      error: "Palpite de campeão fechado (a Copa já começou) ou inválido.",
    };
  }
  revalidatePath("/palpites/campeao");
  revalidatePath("/palpites");
  return { ok: true };
}

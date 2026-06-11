// Regras de prazo (deadline) — funções puras de tempo.

/**
 * Um palpite está FECHADO quando o admin travou manualmente
 * OU quando o horário-limite (deadline) já passou.
 */
export function isLocked(
  deadline: string | null,
  isManuallyLocked: boolean,
  now: Date = new Date(),
): boolean {
  if (isManuallyLocked) return true;
  if (!deadline) return false; // sem deadline definido => ainda aberto
  return new Date(deadline).getTime() <= now.getTime();
}

/** Tempo restante em milissegundos até o deadline (0 se já passou). */
export function msUntil(deadline: string | null, now: Date = new Date()): number {
  if (!deadline) return Number.POSITIVE_INFINITY;
  return Math.max(0, new Date(deadline).getTime() - now.getTime());
}

/** Formata um deadline para exibição em PT-BR (fuso de São Paulo). */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "a definir";
  return new Date(deadline).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Menor kickoff (ISO) de uma lista de jogos — usado para deadline da rodada. */
export function earliestKickoff(kickoffs: (string | null)[]): string | null {
  const valid = kickoffs.filter((k): k is string => !!k).sort();
  return valid.length ? valid[0] : null;
}

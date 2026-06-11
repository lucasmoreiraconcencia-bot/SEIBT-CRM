"use client";

import { useState, useTransition } from "react";
import { saveGroupPrediction } from "@/lib/actions/predictions";
import { GROUP_POSITION_POINTS } from "@/lib/scoring";
import type { Team } from "@/lib/types";

const POS_LABEL = ["1º", "2º", "3º", "4º"] as const;

export function GroupPredictionForm({
  groupLetter,
  teams,
  initial,
}: {
  groupLetter: string;
  teams: Team[];
  initial: [string, string, string, string] | null;
}) {
  const [order, setOrder] = useState<string[]>(
    initial ? [...initial] : ["", "", "", ""],
  );
  const [saved, setSaved] = useState(initial != null);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function setPos(idx: number, teamId: string) {
    const next = [...order];
    next[idx] = teamId;
    setOrder(next);
    setMsg(null);
  }

  const duplicated =
    new Set(order.filter(Boolean)).size !== order.filter(Boolean).length;

  function save() {
    if (order.some((o) => !o)) {
      setMsg({ text: "Preencha as 4 posições." });
      return;
    }
    if (duplicated) {
      setMsg({ text: "Cada seleção só pode ocupar uma posição." });
      return;
    }
    startTransition(async () => {
      const r = await saveGroupPrediction(
        groupLetter,
        order as [string, string, string, string],
      );
      if (r.ok) setSaved(true);
      setMsg(r.ok ? { ok: true, text: "✓ Palpite salvo!" } : { text: r.error ?? "Erro" });
    });
  }

  return (
    <div>
      <div className="space-y-2">
        {POS_LABEL.map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-sm font-bold text-white/70">
              {label}
              <span className="ml-1 text-xs font-normal text-copa-gold">
                {GROUP_POSITION_POINTS[(idx + 1) as 1 | 2 | 3 | 4]}pt
              </span>
            </span>
            <select
              className="input"
              value={order[idx]}
              onChange={(e) => setPos(idx, e.target.value)}
            >
              <option value="">Selecione…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={pending} className="btn-primary mt-3 w-full">
        {pending ? "Salvando…" : "Salvar palpite do grupo"}
      </button>

      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>
          {msg.text}
        </p>
      )}
      {!msg && saved && (
        <p className="mt-2 text-xs text-emerald-300/80">
          ✓ Palpite salvo — você pode alterar até o grupo fechar.
        </p>
      )}
    </div>
  );
}

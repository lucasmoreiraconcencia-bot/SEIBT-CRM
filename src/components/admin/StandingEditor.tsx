"use client";

import { useState, useTransition } from "react";
import { overrideGroupStanding } from "@/lib/actions/admin";
import type { Team } from "@/lib/types";

const POS_LABEL = ["1º", "2º", "3º", "4º"] as const;

export function StandingEditor({
  groupLetter,
  teams,
  initial,
  initialFinal,
}: {
  groupLetter: string;
  teams: Team[];
  initial: [string, string, string, string] | null;
  initialFinal: boolean;
}) {
  const [order, setOrder] = useState<string[]>(initial ? [...initial] : ["", "", "", ""]);
  const [isFinal, setIsFinal] = useState(initialFinal);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function setPos(idx: number, id: string) {
    const next = [...order];
    next[idx] = id;
    setOrder(next);
  }

  function save() {
    if (order.some((o) => !o) || new Set(order).size !== 4) {
      setMsg({ text: "Informe 4 seleções diferentes." });
      return;
    }
    startTransition(async () => {
      const r = await overrideGroupStanding(
        groupLetter,
        order as [string, string, string, string],
        isFinal,
      );
      setMsg(r.ok ? { ok: true, text: "Salvo ✓" } : { text: r.error ?? "Erro" });
    });
  }

  if (teams.length < 4) {
    return <p className="text-sm text-white/40">Grupo sem 4 seleções sincronizadas.</p>;
  }

  return (
    <div className="space-y-2">
      {POS_LABEL.map((label, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-7 text-sm text-white/50">{label}</span>
          <select className="input" value={order[idx]} onChange={(e) => setPos(idx, e.target.value)}>
            <option value="">—</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={isFinal}
          onChange={(e) => setIsFinal(e.target.checked)}
        />
        Marcar grupo como encerrado (libera a pontuação)
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {pending ? "Salvando…" : "Salvar classificação"}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { saveChampionPrediction } from "@/lib/actions/predictions";
import type { Team } from "@/lib/types";

export function ChampionPicker({
  teams,
  initialTeamId,
}: {
  teams: Team[];
  initialTeamId: string | null;
}) {
  const [teamId, setTeamId] = useState(initialTeamId ?? "");
  const [savedId, setSavedId] = useState(initialTeamId);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Agrupa por grupo para o <select>
  const byGroup = new Map<string, Team[]>();
  for (const t of teams) {
    const k = t.group_letter ?? "—";
    byGroup.set(k, [...(byGroup.get(k) ?? []), t]);
  }
  const groupKeys = [...byGroup.keys()].sort();

  function save() {
    if (!teamId) {
      setMsg({ text: "Escolha uma seleção." });
      return;
    }
    startTransition(async () => {
      const r = await saveChampionPrediction(teamId);
      if (r.ok) setSavedId(teamId);
      setMsg(r.ok ? { ok: true, text: "✓ Palpite salvo!" } : { text: r.error ?? "Erro" });
    });
  }

  return (
    <div className="card p-4">
      <label className="mb-2 block text-sm font-semibold text-white/70">
        Quem será o campeão da Copa?
      </label>
      <select
        className="input"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      >
        <option value="">Selecione…</option>
        {groupKeys.map((k) => (
          <optgroup key={k} label={k === "—" ? "Outras" : `Grupo ${k}`}>
            {byGroup.get(k)!.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <button onClick={save} disabled={pending} className="btn-gold mt-3 w-full">
        {pending ? "Salvando…" : "Salvar palpite de campeão"}
      </button>

      {msg && (
        <p
          className={`mt-3 text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}
        >
          {msg.text}
        </p>
      )}
      {!msg && savedId && (
        <p className="mt-3 text-sm text-emerald-300/80">
          ✓ Palpite salvo:{" "}
          <b>{teams.find((t) => t.id === savedId)?.name ?? "?"}</b> — você pode
          alterar até o fechamento.
        </p>
      )}
    </div>
  );
}

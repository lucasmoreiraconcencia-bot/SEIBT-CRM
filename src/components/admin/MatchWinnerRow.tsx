"use client";

import { useState, useTransition } from "react";
import { overrideMatchWinner } from "@/lib/actions/admin";
import type { Team } from "@/lib/types";

export function MatchWinnerRow({
  matchId,
  label,
  home,
  away,
  currentWinner,
}: {
  matchId: string;
  label: string;
  home: Team | null;
  away: Team | null;
  currentWinner: string | null;
}) {
  const [winner, setWinner] = useState(currentWinner ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    startTransition(async () => {
      await overrideMatchWinner(matchId, winner || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="card flex flex-wrap items-center gap-2 p-3 text-sm">
      <span className="min-w-0 flex-1 truncate text-white/70">
        <span className="text-white/40">{label}:</span>{" "}
        {home?.name ?? "?"} × {away?.name ?? "?"}
      </span>
      <select
        className="input max-w-[170px]"
        value={winner}
        onChange={(e) => setWinner(e.target.value)}
      >
        <option value="">Quem avançou…</option>
        {home && <option value={home.id}>{home.name}</option>}
        {away && <option value={away.id}>{away.name}</option>}
      </select>
      <button onClick={save} disabled={pending} className="btn-primary px-3 py-2">
        {pending ? "…" : saved ? "✓" : "Salvar"}
      </button>
    </div>
  );
}

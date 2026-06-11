"use client";

import { useState, useTransition } from "react";
import { saveMatchPrediction } from "@/lib/actions/predictions";
import type { Team } from "@/lib/types";

export function MatchPredictionForm({
  matchId,
  home,
  away,
  initialPick,
}: {
  matchId: string;
  home: Team;
  away: Team;
  initialPick: string | null;
}) {
  const [pick, setPick] = useState<string | null>(initialPick);
  const [savedPick, setSavedPick] = useState<string | null>(initialPick);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(teamId: string) {
    const prev = pick;
    setPick(teamId);
    setMsg(null);
    startTransition(async () => {
      const r = await saveMatchPrediction(matchId, teamId);
      if (!r.ok) {
        setPick(prev);
        setMsg(r.error ?? "Erro");
      } else {
        setSavedPick(teamId);
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {[home, away].map((t) => {
          const selected = pick === t.id;
          return (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              disabled={pending}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border-copa-gold bg-copa-gold/15 text-white shadow-glow"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {t.flag_url && (
                <span className="crest h-6 w-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.flag_url} alt="" className="h-full w-full object-contain" />
                </span>
              )}
              {t.name}
            </button>
          );
        })}
      </div>
      {msg && <p className="mt-1 text-xs text-red-300">{msg}</p>}
      {!msg && savedPick && (
        <p className="mt-1.5 text-xs text-emerald-300/80">
          ✓ Palpite salvo — você pode alterar até a rodada fechar.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export interface RankRow {
  userId: string;
  name: string;
  avatar: string | null;
  points: number;
  isPaid?: boolean;
}

export interface RankTab {
  key: string;
  label: string;
  rows: RankRow[];
}

// cores de pódio para os 3 primeiros
const PODIUM = ["text-copa-gold", "text-zinc-300", "text-amber-600"];

export function RankingTabs({ tabs }: { tabs: RankTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "geral");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              active === t.key
                ? "bg-copa-gold text-copa-ink shadow-glow"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <RankList rows={current?.rows ?? []} />
    </div>
  );
}

function computeRanks(rows: RankRow[]): number[] {
  // ranking de competição (empate compartilha posição: 1,2,2,4...)
  let lastPoints: number | null = null;
  let lastRank = 0;
  return rows.map((r, i) => {
    const rank = lastPoints === r.points ? lastRank : i + 1;
    lastPoints = r.points;
    lastRank = rank;
    return rank;
  });
}

function RankList({ rows }: { rows: RankRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="card p-6 text-center text-white/50">
        Sem pontos por aqui ainda. Volte quando os jogos começarem.
      </p>
    );
  }

  const ranks = computeRanks(rows);
  const hasPodium = rows.length >= 3;
  const podiumRows = hasPodium ? rows.slice(0, 3) : [];
  const listRows = hasPodium ? rows.slice(3) : rows;
  const listRanks = hasPodium ? ranks.slice(3) : ranks;

  return (
    <div>
      {/* pódio: 2º — 1º — 3º */}
      {hasPodium && (
        <div className="mb-4 grid grid-cols-3 items-end gap-2">
          <PodiumCard row={podiumRows[1]} rank={ranks[1]} place={2} />
          <PodiumCard row={podiumRows[0]} rank={ranks[0]} place={1} />
          <PodiumCard row={podiumRows[2]} rank={ranks[2]} place={3} />
        </div>
      )}

      <ol className="space-y-2">
        {listRows.map((r, i) => {
          const rank = listRanks[i];
          const podium = rank <= 3 ? PODIUM[rank - 1] : "text-white/50";
          return (
            <li key={r.userId} className="card flex items-center gap-3 p-3">
              <span className={`w-8 text-center font-display text-lg font-extrabold ${podium}`}>
                {rank}
              </span>
              <Avatar row={r} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{r.name}</p>
                {r.isPaid === false && (
                  <span className="badge bg-amber-400/15 text-amber-400">
                    pagamento pendente
                  </span>
                )}
              </div>
              <span className="font-display text-xl font-extrabold text-copa-gold">
                {r.points}
                <span className="ml-1 font-sans text-xs font-medium text-white/40">
                  pts
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PodiumCard({
  row,
  rank,
  place,
}: {
  row: RankRow;
  rank: number;
  place: 1 | 2 | 3;
}) {
  const ring =
    place === 1
      ? "ring-2 ring-copa-gold shadow-glow"
      : place === 2
        ? "ring-1 ring-zinc-300/60"
        : "ring-1 ring-amber-600/60";
  const height = place === 1 ? "pt-5" : "pt-3";
  return (
    <div className={`card-accent flex flex-col items-center gap-1.5 p-3 text-center ${height}`}>
      <Avatar row={row} className={`${place === 1 ? "h-16 w-16" : "h-12 w-12"} ${ring}`} />
      <p className="w-full truncate text-sm font-semibold text-white">{row.name}</p>
      <p className={`font-display text-lg font-extrabold leading-none ${PODIUM[place - 1]}`}>
        {row.points}
        <span className="ml-0.5 font-sans text-[10px] font-medium text-white/40">pts</span>
      </p>
      <span className="badge bg-white/10 text-white/60">{rank}º lugar</span>
      {row.isPaid === false && (
        <span className="badge bg-amber-400/15 text-amber-400">pendente</span>
      )}
    </div>
  );
}

function Avatar({ row, className }: { row: RankRow; className?: string }) {
  if (row.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={row.avatar}
        alt={row.name}
        className={`rounded-full border border-white/15 object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`grid place-items-center rounded-full bg-copa-blue font-bold ${className}`}
    >
      {row.name.charAt(0)}
    </div>
  );
}

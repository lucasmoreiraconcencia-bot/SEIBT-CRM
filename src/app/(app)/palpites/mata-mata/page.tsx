import { requireUser } from "@/lib/auth";
import {
  getMatches,
  getRoundLocks,
  getTeams,
  getMyMatchPreds,
  getAllMatchPredsAll,
} from "@/lib/data";
import { isLocked, formatDeadline } from "@/lib/deadlines";
import { ROUND_LABELS, ROUND_POINTS } from "@/lib/scoring";
import { MatchPredictionForm } from "@/components/MatchPredictionForm";
import { TeamPill } from "@/components/TeamPill";
import { PageHeader } from "@/components/PageHeader";
import { PaymentNotice } from "@/components/PaymentNotice";
import type { RoundCode, Team, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const KO_ROUNDS: Exclude<RoundCode, "group">[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export default async function MataMataPage() {
  const user = await requireUser();
  const [matches, locks, teams, myPreds, allPreds] = await Promise.all([
    getMatches(),
    getRoundLocks(),
    getTeams(),
    getMyMatchPreds(user.id),
    getAllMatchPredsAll(),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const lockMap = new Map(locks.map((l) => [l.round, l]));
  const myMap = new Map(myPreds.map((p) => [p.match_id, p]));
  const allByMatch = new Map<string, typeof allPreds>();
  for (const p of allPreds) {
    allByMatch.set(p.match_id, [...(allByMatch.get(p.match_id) ?? []), p]);
  }

  const byRound = new Map<RoundCode, Match[]>();
  for (const m of matches) {
    if (m.round === "group") continue;
    byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);
  }

  const anyMatches = KO_ROUNDS.some((r) => (byRound.get(r) ?? []).length > 0);

  return (
    <div>
      <PageHeader
        title="Mata-mata"
        subtitle="Escolha quem avança. Vale quem passar (inclui prorrogação/pênaltis)."
      />

      {!user.is_paid && <PaymentNotice />}

      {!anyMatches && (
        <p className="card p-6 text-center text-white/50">
          Os confrontos do mata-mata aparecem aqui quando a fase de grupos
          terminar e a sincronização trouxer o chaveamento.
        </p>
      )}

      <div className="space-y-5">
        {KO_ROUNDS.map((round) => {
          const ms = (byRound.get(round) ?? []).sort((a, b) =>
            (a.kickoff ?? "").localeCompare(b.kickoff ?? ""),
          );
          if (ms.length === 0) return null;
          const lock = lockMap.get(round);
          const locked = isLocked(lock?.deadline ?? null, lock?.is_locked ?? false);

          return (
            <section key={round}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {ROUND_LABELS[round]}{" "}
                  <span className="text-sm font-normal text-copa-gold">
                    {ROUND_POINTS[round]}pt
                  </span>
                </h2>
                <span className={locked ? "badge-closed" : "badge-open"}>
                  {locked ? "Fechado" : `Fecha ${formatDeadline(lock?.deadline ?? null)}`}
                </span>
              </div>

              <div className="space-y-2">
                {ms.map((m) => {
                  const home = m.home_team_id ? teamMap.get(m.home_team_id) : null;
                  const away = m.away_team_id ? teamMap.get(m.away_team_id) : null;
                  const mine = myMap.get(m.id);
                  const all = allByMatch.get(m.id) ?? [];

                  return (
                    <div key={m.id} className="card p-3">
                      {!locked && home && away && user.is_paid ? (
                        <MatchPredictionForm
                          matchId={m.id}
                          home={home}
                          away={away}
                          initialPick={mine?.picked_team_id ?? null}
                        />
                      ) : !locked && home && away ? (
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <TeamPill team={home} size="sm" />
                            <span className="px-2 text-white/40">×</span>
                            <TeamPill team={away} size="sm" />
                          </div>
                          <p className="mt-2 text-xs text-white/60">
                            Seu palpite:{" "}
                            <b className="text-white/80">
                              {mine
                                ? teamMap.get(mine.picked_team_id)?.name ?? "?"
                                : "— (bloqueado até confirmar o pagamento)"}
                            </b>
                          </p>
                        </div>
                      ) : !locked ? (
                        <p className="text-center text-sm text-white/40">
                          Confronto a definir
                        </p>
                      ) : (
                        <LockedMatch
                          match={m}
                          teamMap={teamMap}
                          myPick={mine?.picked_team_id ?? null}
                          myPoints={mine?.points ?? null}
                          all={all}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LockedMatch({
  match,
  teamMap,
  myPick,
  myPoints,
  all,
}: {
  match: Match;
  teamMap: Map<string, Team>;
  myPick: string | null;
  myPoints: number | null;
  all: { user_id: string; full_name: string | null; picked_team_id: string }[];
}) {
  const home = match.home_team_id ? teamMap.get(match.home_team_id) : null;
  const away = match.away_team_id ? teamMap.get(match.away_team_id) : null;
  const winner = match.winner_team_id;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className={winner === home?.id ? "font-bold text-emerald-300" : ""}>
          <TeamPill team={home} size="sm" />
        </span>
        <span className="px-2 text-white/40">×</span>
        <span className={winner === away?.id ? "font-bold text-emerald-300" : ""}>
          <TeamPill team={away} size="sm" />
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-white/60">
          Seu palpite:{" "}
          <b className="text-white/80">
            {myPick ? teamMap.get(myPick)?.name ?? "?" : "— (0 pts)"}
          </b>
        </span>
        {myPoints != null && (
          <b className={myPoints > 0 ? "text-emerald-300" : "text-white/40"}>
            {myPoints} pts
          </b>
        )}
      </div>

      {all.length > 0 && (
        <details className="mt-2 rounded-lg bg-white/5 p-2">
          <summary className="cursor-pointer text-xs text-white/60">
            Palpites de todos ({all.length})
          </summary>
          <ul className="mt-1 space-y-0.5 text-xs">
            {all.map((p) => (
              <li key={p.user_id} className="flex justify-between">
                <span className="text-white/80">{p.full_name ?? "Sem nome"}</span>
                <span className="text-white/50">
                  {teamMap.get(p.picked_team_id)?.name ?? "?"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

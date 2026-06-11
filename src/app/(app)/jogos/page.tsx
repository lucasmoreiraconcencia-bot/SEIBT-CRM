import { getMatches, getTeams, getStandings, getGroups } from "@/lib/data";
import { ROUND_LABELS } from "@/lib/scoring";
import { formatDeadline } from "@/lib/deadlines";
import { TeamPill } from "@/components/TeamPill";
import { PageHeader } from "@/components/PageHeader";
import type { RoundCode, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROUND_FLOW: RoundCode[] = ["group", "r32", "r16", "qf", "sf", "third", "final"];
const POS_LABEL = ["1º", "2º", "3º", "4º"] as const;

export default async function JogosPage() {
  const [matches, teams, standings, groups] = await Promise.all([
    getMatches(),
    getTeams(),
    getStandings(),
    getGroups(),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const standingMap = new Map(standings.map((s) => [s.group_letter, s]));

  const byRound = new Map<RoundCode, Match[]>();
  for (const m of matches) {
    byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);
  }

  const hasData = matches.length > 0 || standings.some((s) => s.pos1_team_id);

  return (
    <div>
      <PageHeader
        title="Jogos e resultados"
        subtitle="Atualizado automaticamente pela API."
      />

      {!hasData && (
        <p className="card p-6 text-center text-white/50">
          Ainda não há dados. O administrador precisa rodar a sincronização.
        </p>
      )}

      {/* Classificação dos grupos */}
      {standings.some((s) => s.pos1_team_id) && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-bold text-white">Classificação dos grupos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => {
              const s = standingMap.get(g.letter);
              if (!s?.pos1_team_id) return null;
              const order = [s.pos1_team_id, s.pos2_team_id, s.pos3_team_id, s.pos4_team_id];
              return (
                <div key={g.letter} className="card p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold text-white">Grupo {g.letter}</h3>
                    {s.is_final && <span className="badge-closed">encerrado</span>}
                  </div>
                  <ol className="space-y-0.5 text-sm">
                    {order.map((id, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-6 text-white/50">{POS_LABEL[i]}</span>
                        <TeamPill team={id ? teamMap.get(id) : null} size="sm" />
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Jogos por fase */}
      {ROUND_FLOW.map((round) => {
        const ms = (byRound.get(round) ?? []).sort((a, b) =>
          (a.kickoff ?? "").localeCompare(b.kickoff ?? ""),
        );
        if (ms.length === 0) return null;
        return (
          <section key={round} className="mb-5">
            <h2 className="mb-2 text-lg font-bold text-white">{ROUND_LABELS[round]}</h2>
            <div className="space-y-2">
              {ms.map((m) => (
                <div key={m.id} className="card flex items-center justify-between p-3 text-sm">
                  <TeamPill team={m.home_team_id ? teamMap.get(m.home_team_id) : null} size="sm" />
                  <div className="px-3 text-center">
                    {m.status === "scheduled" ? (
                      <span className="text-xs text-white/40">
                        {formatDeadline(m.kickoff)}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-white/10 px-3 py-1 font-display text-base font-extrabold text-white">
                        {m.home_score ?? 0} <span className="text-white/40">×</span>{" "}
                        {m.away_score ?? 0}
                      </span>
                    )}
                    {m.status === "live" && (
                      <div className="text-[10px] font-bold text-red-400">AO VIVO</div>
                    )}
                  </div>
                  <TeamPill team={m.away_team_id ? teamMap.get(m.away_team_id) : null} size="sm" />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

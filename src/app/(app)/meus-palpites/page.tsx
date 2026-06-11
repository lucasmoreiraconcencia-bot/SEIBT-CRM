import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getTeams,
  getGroups,
  getMatches,
  getMyChampion,
  getMyGroupPreds,
  getMyMatchPreds,
} from "@/lib/data";
import { ROUND_LABELS, CHAMPION_POINTS } from "@/lib/scoring";
import { TeamPill } from "@/components/TeamPill";
import { PageHeader } from "@/components/PageHeader";
import type { RoundCode, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const POS_LABEL = ["1º", "2º", "3º", "4º"] as const;
const KO_ROUNDS: Exclude<RoundCode, "group">[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export default async function MeusPalpitesPage() {
  const user = await requireUser();
  const [teams, groups, matches, myChampion, myGroupPreds, myMatchPreds] =
    await Promise.all([
      getTeams(),
      getGroups(),
      getMatches(),
      getMyChampion(user.id),
      getMyGroupPreds(user.id),
      getMyMatchPreds(user.id),
    ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const groupPredMap = new Map(myGroupPreds.map((p) => [p.group_letter, p]));
  const matchPredMap = new Map(myMatchPreds.map((p) => [p.match_id, p]));

  const byRound = new Map<RoundCode, Match[]>();
  for (const m of matches) {
    if (m.round === "group") continue;
    if (!m.home_team_id || !m.away_team_id) continue;
    byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);
  }

  const groupsDone = myGroupPreds.length;
  const groupsTotal = groups.length || 12;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meus Palpites"
        subtitle="Tudo o que você já palpitou, num lugar só. Para alterar, use a aba Palpitar."
      />

      {/* Campeão */}
      <section className="card-accent p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold text-white">
            Campeão{" "}
            <span className="text-sm font-normal text-copa-gold">
              {CHAMPION_POINTS}pts
            </span>
          </h2>
          <EditLink href="/palpites/campeao" />
        </div>
        {myChampion ? (
          <div className="flex items-center justify-between">
            <TeamPill team={teamMap.get(myChampion.team_id)} />
            {myChampion.points != null && <Points value={myChampion.points} />}
          </div>
        ) : (
          <Missing text="Você ainda não escolheu o campeão." />
        )}
      </section>

      {/* Fase de grupos */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Fase de Grupos{" "}
            <span className="text-sm font-normal text-white/50">
              {groupsDone}/{groupsTotal}
            </span>
          </h2>
          <EditLink href="/palpites/grupos" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const p = groupPredMap.get(g.letter);
            const order = p
              ? [p.pos1_team_id, p.pos2_team_id, p.pos3_team_id, p.pos4_team_id]
              : null;
            return (
              <div key={g.letter} className="card p-3">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-bold text-white">Grupo {g.letter}</h3>
                  {p?.points != null && <Points value={p.points} />}
                </div>
                {order ? (
                  <ol className="space-y-0.5 text-sm">
                    {order.map((id, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-6 text-white/50">{POS_LABEL[i]}</span>
                        <TeamPill team={teamMap.get(id)} size="sm" />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <Missing text="Sem palpite." />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Mata-mata */}
      {KO_ROUNDS.some((r) => (byRound.get(r) ?? []).length > 0) && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mata-mata</h2>
            <EditLink href="/palpites/mata-mata" />
          </div>
          <div className="space-y-4">
            {KO_ROUNDS.map((round) => {
              const ms = (byRound.get(round) ?? []).sort((a, b) =>
                (a.kickoff ?? "").localeCompare(b.kickoff ?? ""),
              );
              if (ms.length === 0) return null;
              return (
                <div key={round}>
                  <h3 className="mb-1 text-sm font-semibold text-white/70">
                    {ROUND_LABELS[round]}
                  </h3>
                  <div className="space-y-2">
                    {ms.map((m) => {
                      const p = matchPredMap.get(m.id);
                      return (
                        <div
                          key={m.id}
                          className="card flex items-center justify-between gap-2 p-3 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <TeamPill
                              team={m.home_team_id ? teamMap.get(m.home_team_id) : null}
                              size="sm"
                            />
                            <span className="text-white/40">×</span>
                            <TeamPill
                              team={m.away_team_id ? teamMap.get(m.away_team_id) : null}
                              size="sm"
                            />
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {p ? (
                              <span className="text-xs text-white/60">
                                Palpite:{" "}
                                <b className="text-white/90">
                                  {teamMap.get(p.picked_team_id)?.code ??
                                    teamMap.get(p.picked_team_id)?.name ??
                                    "?"}
                                </b>
                              </span>
                            ) : (
                              <span className="text-xs text-amber-300">sem palpite</span>
                            )}
                            {p?.points != null && <Points value={p.points} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-copa-gold hover:underline"
    >
      <Pencil size={12} />
      editar
    </Link>
  );
}

function Missing({ text }: { text: string }) {
  return <p className="text-sm text-amber-300">⚠ {text}</p>;
}

function Points({ value }: { value: number }) {
  return (
    <span
      className={`font-display text-base font-extrabold ${
        value > 0 ? "text-emerald-300" : "text-white/40"
      }`}
    >
      {value}
      <span className="ml-0.5 font-sans text-[10px] font-medium text-white/40">pts</span>
    </span>
  );
}

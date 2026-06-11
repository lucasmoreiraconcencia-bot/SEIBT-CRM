import { requireUser } from "@/lib/auth";
import {
  getGroups,
  getTeamsByGroup,
  getMyGroupPreds,
  getStandings,
  getAllGroupPredsAll,
} from "@/lib/data";
import { isLocked, formatDeadline } from "@/lib/deadlines";
import { TeamPill } from "@/components/TeamPill";
import { GroupPredictionForm } from "@/components/GroupPredictionForm";
import { PageHeader } from "@/components/PageHeader";
import { PaymentNotice } from "@/components/PaymentNotice";
import type { Team, PredictionGroup, GroupStanding } from "@/lib/types";

export const dynamic = "force-dynamic";

const POS_LABEL = ["1º", "2º", "3º", "4º"] as const;

export default async function GruposPage() {
  const user = await requireUser();
  const [groups, teamsByGroup, myPreds, standings, allPreds] = await Promise.all([
    getGroups(),
    getTeamsByGroup(),
    getMyGroupPreds(user.id),
    getStandings(),
    getAllGroupPredsAll(),
  ]);

  const myMap = new Map(myPreds.map((p) => [p.group_letter, p]));
  const standingMap = new Map(standings.map((s) => [s.group_letter, s]));
  const allByGroup = new Map<string, typeof allPreds>();
  for (const p of allPreds) {
    allByGroup.set(p.group_letter, [...(allByGroup.get(p.group_letter) ?? []), p]);
  }

  return (
    <div>
      <PageHeader
        title="Fase de Grupos"
        subtitle="Ordene 1º a 4º de cada grupo. Pontos: 1º=5, 2º=3, 3º=2, 4º=0."
      />

      {!user.is_paid && <PaymentNotice />}

      <div className="space-y-4">
        {groups.map((g) => {
          const teams = (teamsByGroup.get(g.letter) ?? []).slice().sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          const locked = isLocked(g.deadline, g.is_locked);
          const mine = myMap.get(g.letter);
          const standing = standingMap.get(g.letter);
          const initial: [string, string, string, string] | null = mine
            ? [mine.pos1_team_id, mine.pos2_team_id, mine.pos3_team_id, mine.pos4_team_id]
            : null;

          return (
            <section key={g.letter} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Grupo {g.letter}</h2>
                <div className="flex items-center gap-1.5">
                  {!locked && initial && (
                    <span className="badge bg-emerald-400/15 text-emerald-300">
                      ✓ salvo
                    </span>
                  )}
                  <span className={locked ? "badge-closed" : "badge-open"}>
                    {locked ? "Fechado" : `Fecha ${formatDeadline(g.deadline)}`}
                  </span>
                </div>
              </div>

              {!locked && teams.length >= 4 && user.is_paid && (
                <GroupPredictionForm
                  groupLetter={g.letter}
                  teams={teams}
                  initial={initial}
                />
              )}
              {!locked && teams.length >= 4 && !user.is_paid && (
                initial ? (
                  <ol className="space-y-1">
                    {initial.map((id, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 text-white/50">{POS_LABEL[i]}</span>
                        <TeamPill team={teams.find((t) => t.id === id)} size="sm" />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-white/50">
                    Bloqueado até a confirmação do pagamento.
                  </p>
                )
              )}
              {!locked && teams.length < 4 && (
                <p className="text-sm text-white/50">
                  Aguardando definição/sincronização das seleções deste grupo.
                </p>
              )}

              {locked && (
                <LockedGroup
                  mine={mine}
                  standing={standing}
                  teamsById={teamsByGroup}
                  allPreds={allByGroup.get(g.letter) ?? []}
                />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LockedGroup({
  mine,
  standing,
  teamsById,
  allPreds,
}: {
  mine: PredictionGroup | undefined;
  standing: GroupStanding | undefined;
  teamsById: Map<string, Team[]>;
  allPreds: (PredictionGroup & { full_name: string | null })[];
}) {
  // Mapa global id->team
  const map = new Map<string, Team>();
  for (const arr of teamsById.values()) for (const t of arr) map.set(t.id, t);

  const official = standing?.is_final
    ? [standing.pos1_team_id, standing.pos2_team_id, standing.pos3_team_id, standing.pos4_team_id]
    : null;
  const myOrder = mine
    ? [mine.pos1_team_id, mine.pos2_team_id, mine.pos3_team_id, mine.pos4_team_id]
    : null;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-semibold text-white/70">Seu palpite</p>
        {myOrder ? (
          <ol className="space-y-1">
            {myOrder.map((id, i) => {
              const hit = official ? official[i] === id : null;
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-white/50">{POS_LABEL[i]}</span>
                  <TeamPill team={map.get(id ?? "")} size="sm" />
                  {hit === true && <span className="text-emerald-400">✓</span>}
                  {hit === false && <span className="text-red-400">✗</span>}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-white/40">Você não palpitou (0 pts).</p>
        )}
        {mine?.points != null && (
          <p className="mt-1 text-sm font-bold text-copa-gold">{mine.points} pts</p>
        )}
      </div>

      {official && (
        <div>
          <p className="mb-1 text-sm font-semibold text-white/70">Resultado oficial</p>
          <ol className="space-y-1">
            {official.map((id, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-white/50">{POS_LABEL[i]}</span>
                <TeamPill team={map.get(id ?? "")} size="sm" />
              </li>
            ))}
          </ol>
        </div>
      )}

      {allPreds.length > 0 && (
        <details className="rounded-lg bg-white/5 p-2">
          <summary className="cursor-pointer text-sm text-white/60">
            Ver palpites de todos ({allPreds.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm">
            {allPreds.map((p) => (
              <li key={p.user_id} className="flex items-center justify-between gap-2">
                <span className="text-white/80">{p.full_name ?? "Sem nome"}</span>
                <span className="text-white/50">
                  {[p.pos1_team_id, p.pos2_team_id, p.pos3_team_id, p.pos4_team_id]
                    .map((id) => map.get(id)?.code ?? map.get(id)?.name ?? "?")
                    .join(" › ")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

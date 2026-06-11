import { requireUser } from "@/lib/auth";
import {
  getSettings,
  getTeams,
  getMyChampion,
  getAllChampionPreds,
  getMatches,
} from "@/lib/data";
import { isLocked, formatDeadline } from "@/lib/deadlines";
import { CHAMPION_POINTS } from "@/lib/scoring";
import { ChampionPicker } from "@/components/ChampionPicker";
import { TeamPill } from "@/components/TeamPill";
import { PageHeader } from "@/components/PageHeader";
import { PaymentNotice } from "@/components/PaymentNotice";
import type { Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CampeaoPage() {
  const user = await requireUser();
  const [settings, teams, mine, matches] = await Promise.all([
    getSettings(),
    getTeams(),
    getMyChampion(user.id),
    getMatches(),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const locked = isLocked(settings?.champion_deadline ?? null, false);

  const finalMatch = matches.find(
    (m) => m.round === "final" && m.status === "finished" && m.winner_team_id,
  );
  const championId = finalMatch?.winner_team_id ?? null;

  return (
    <div>
      <PageHeader
        title="Palpite de Campeão"
        subtitle={`Acertar o campeão da Copa vale ${CHAMPION_POINTS} pontos. Prazo: ${formatDeadline(settings?.champion_deadline ?? null)}.`}
      />

      {teams.length === 0 ? (
        <p className="card p-6 text-center text-white/50">
          As seleções ainda não foram sincronizadas. Peça ao administrador para
          rodar a sincronização.
        </p>
      ) : !locked && !user.is_paid ? (
        <div>
          <PaymentNotice />
          {mine && (
            <div className="card p-4">
              <p className="text-sm text-white/60">Seu palpite atual</p>
              <div className="mt-1 text-lg font-bold">
                <TeamPill team={teamMap.get(mine.team_id)} />
              </div>
            </div>
          )}
        </div>
      ) : !locked ? (
        <ChampionPicker teams={teams} initialTeamId={mine?.team_id ?? null} />
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm text-white/60">Seu palpite</p>
            <div className="mt-1 text-lg font-bold">
              {mine ? <TeamPill team={teamMap.get(mine.team_id)} /> : "— (não palpitou)"}
            </div>
            {championId && (
              <p className="mt-2 text-sm">
                Campeão: <TeamPill team={teamMap.get(championId)} /> ·{" "}
                <b className={mine?.points ? "text-emerald-300" : "text-white/50"}>
                  {mine?.points ?? 0} pts
                </b>
              </p>
            )}
          </div>

          <RevealAll teamMap={teamMap} />
        </div>
      )}
    </div>
  );
}

async function RevealAll({ teamMap }: { teamMap: Map<string, Team> }) {
  const all = await getAllChampionPreds();
  if (all.length === 0) return null;
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-bold text-white">Palpites de todos</h2>
      <ul className="space-y-1.5">
        {all.map((p) => (
          <li key={p.user_id} className="flex items-center justify-between text-sm">
            <span className="text-white/80">{p.full_name ?? "Sem nome"}</span>
            <TeamPill team={teamMap.get(p.team_id)} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

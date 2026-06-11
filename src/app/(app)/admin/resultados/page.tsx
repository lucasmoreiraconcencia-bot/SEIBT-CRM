import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getMatches,
  getTeams,
  getTeamsByGroup,
  getGroups,
  getStandings,
} from "@/lib/data";
import { ROUND_LABELS } from "@/lib/scoring";
import { MatchWinnerRow } from "@/components/admin/MatchWinnerRow";
import { StandingEditor } from "@/components/admin/StandingEditor";
import { PageHeader } from "@/components/PageHeader";
import type { RoundCode, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const KO_ROUNDS: Exclude<RoundCode, "group">[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export default async function ResultadosPage() {
  const [matches, teams, teamsByGroup, groups, standings] = await Promise.all([
    getMatches(),
    getTeams(),
    getTeamsByGroup(),
    getGroups(),
    getStandings(),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const standingMap = new Map(standings.map((s) => [s.group_letter, s]));
  const byRound = new Map<RoundCode, Match[]>();
  for (const m of matches) byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={15} />
          Admin
        </Link>
      </div>
      <PageHeader
        title="Corrigir resultados"
        subtitle="Use só quando a API atrasar ou errar. Ao salvar, os pontos são recalculados."
      />

      {/* Classificação dos grupos */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Classificação dos grupos</h2>
        <div className="space-y-3">
          {groups.map((g) => {
            const s = standingMap.get(g.letter);
            const tms = (teamsByGroup.get(g.letter) ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name));
            const initial =
              s?.pos1_team_id && s.pos2_team_id && s.pos3_team_id && s.pos4_team_id
                ? ([s.pos1_team_id, s.pos2_team_id, s.pos3_team_id, s.pos4_team_id] as [
                    string,
                    string,
                    string,
                    string,
                  ])
                : null;
            return (
              <div key={g.letter} className="card p-3">
                <h3 className="mb-2 font-bold text-white">Grupo {g.letter}</h3>
                <StandingEditor
                  groupLetter={g.letter}
                  teams={tms}
                  initial={initial}
                  initialFinal={s?.is_final ?? false}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Mata-mata */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Mata-mata</h2>
        <div className="space-y-3">
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
                  {ms.map((m, i) => (
                    <MatchWinnerRow
                      key={m.id}
                      matchId={m.id}
                      label={`Jogo ${i + 1}`}
                      home={m.home_team_id ? teamMap.get(m.home_team_id) ?? null : null}
                      away={m.away_team_id ? teamMap.get(m.away_team_id) ?? null : null}
                      currentWinner={m.winner_team_id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {KO_ROUNDS.every((r) => (byRound.get(r) ?? []).length === 0) && (
            <p className="card p-4 text-center text-sm text-white/50">
              Sem jogos de mata-mata ainda. Sincronize após a fase de grupos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

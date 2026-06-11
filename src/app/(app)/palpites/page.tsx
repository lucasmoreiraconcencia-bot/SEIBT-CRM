import Link from "next/link";
import {
  Crown,
  ListOrdered,
  GitFork,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getSettings,
  getGroups,
  getRoundLocks,
  getTeams,
  getMatches,
  getMyChampion,
  getMyGroupPreds,
  getMyMatchPreds,
} from "@/lib/data";
import { isLocked, formatDeadline } from "@/lib/deadlines";
import { PageHeader } from "@/components/PageHeader";
import { PaymentNotice } from "@/components/PaymentNotice";

export const dynamic = "force-dynamic";

export default async function PalpitesHub() {
  const user = await requireUser();
  const [
    settings,
    groups,
    locks,
    teams,
    matches,
    myChampion,
    myGroupPreds,
    myMatchPreds,
  ] = await Promise.all([
    getSettings(),
    getGroups(),
    getRoundLocks(),
    getTeams(),
    getMatches(),
    getMyChampion(user.id),
    getMyGroupPreds(user.id),
    getMyMatchPreds(user.id),
  ]);

  const championOpen = !isLocked(settings?.champion_deadline ?? null, false);
  const groupsOpen = groups.filter((g) => !isLocked(g.deadline, g.is_locked)).length;
  const roundsOpen = locks.filter((l) => !isLocked(l.deadline, l.is_locked)).length;

  // Progresso dos palpites do usuário
  const championTeam = myChampion
    ? teams.find((t) => t.id === myChampion.team_id)
    : null;
  const groupsTotal = groups.length || 12;
  const groupsDone = myGroupPreds.length;
  const koMatches = matches.filter(
    (m) => m.round !== "group" && m.home_team_id && m.away_team_id,
  );
  const koDone = myMatchPreds.filter((p) =>
    koMatches.some((m) => m.id === p.match_id),
  ).length;

  interface Progress {
    done: boolean;
    text: string;
  }

  const cards: {
    href: string;
    Icon: typeof Crown;
    title: string;
    desc: string;
    status: string;
    open: boolean;
    extra: string;
    progress: Progress | null;
  }[] = [
    {
      href: "/palpites/campeao",
      Icon: Crown,
      title: "Palpite de Campeão",
      desc: "Vale 40 pontos. Só até o 1º jogo da Copa.",
      status: championOpen ? "Aberto" : "Fechado",
      open: championOpen,
      extra: `Prazo: ${formatDeadline(settings?.champion_deadline ?? null)}`,
      progress: championTeam
        ? { done: true, text: `Escolhido: ${championTeam.name}` }
        : { done: false, text: "Você ainda não escolheu" },
    },
    {
      href: "/palpites/grupos",
      Icon: ListOrdered,
      title: "Fase de Grupos",
      desc: "Ordene 1º a 4º de cada grupo (5/3/2/0 pts).",
      status: `${groupsOpen}/${groups.length || 12} abertos`,
      open: groupsOpen > 0,
      extra: "Cada grupo fecha no seu 1º jogo.",
      progress: {
        done: groupsTotal > 0 && groupsDone >= groupsTotal,
        text: `${groupsDone} de ${groupsTotal} grupos palpitados`,
      },
    },
    {
      href: "/palpites/mata-mata",
      Icon: GitFork,
      title: "Mata-mata",
      desc: "Quem avança em cada fase até a final.",
      status: `${roundsOpen} rodada(s) aberta(s)`,
      open: roundsOpen > 0,
      extra: "Cada rodada fecha no seu 1º jogo.",
      progress:
        koMatches.length > 0
          ? {
              done: koDone >= koMatches.length,
              text: `${koDone} de ${koMatches.length} confrontos palpitados`,
            }
          : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Seus palpites"
        subtitle="Palpite não enviado a tempo = 0 ponto."
      />

      {!user.is_paid && <PaymentNotice />}

      <div className="space-y-3">
        {cards.map(({ Icon, ...c }) => (
          <Link key={c.href} href={c.href} className="card-accent block p-4 hover:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-copa-gold/20 to-copa-blue/15">
                <Icon size={22} strokeWidth={1.8} className="text-copa-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-white">{c.title}</h2>
                  <span className={c.open ? "badge-open" : "badge-closed"}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-white/60">{c.desc}</p>
                {c.progress && (
                  <p
                    className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
                      c.progress.done ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {c.progress.done ? (
                      <CheckCircle2 size={13} className="shrink-0" />
                    ) : (
                      <AlertCircle size={13} className="shrink-0" />
                    )}
                    {c.progress.text}
                  </p>
                )}
                <p className="mt-1 text-xs text-white/40">{c.extra}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-white/30" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

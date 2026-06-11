import { getRankingTotals, getRoundPoints } from "@/lib/data";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/scoring";
import { RankingTabs, type RankTab, type RankRow } from "@/components/RankingTabs";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [totals, roundPoints] = await Promise.all([
    getRankingTotals(),
    getRoundPoints(),
  ]);

  // mapa de perfil (nome/avatar/pago) a partir do ranking geral (só ativos)
  const profileMap = new Map(
    totals.map((t) => [
      t.user_id,
      {
        name: t.full_name ?? "Sem nome",
        avatar: t.avatar_url,
        isPaid: t.is_paid,
      },
    ]),
  );

  const geral: RankRow[] = totals.map((t) => ({
    userId: t.user_id,
    name: t.full_name ?? "Sem nome",
    avatar: t.avatar_url,
    points: t.total_points,
    isPaid: t.is_paid,
  }));

  const tabs: RankTab[] = [{ key: "geral", label: "Geral", rows: geral }];

  for (const round of ROUND_ORDER) {
    const rows: RankRow[] = roundPoints
      .filter((r) => r.round === round && profileMap.has(r.user_id))
      .map((r) => {
        const p = profileMap.get(r.user_id)!;
        return { userId: r.user_id, name: p.name, avatar: p.avatar, points: r.points };
      })
      .sort((a, b) => b.points - a.points);
    tabs.push({ key: round, label: ROUND_LABELS[round], rows });
  }

  const leaderTie =
    geral.length > 1 && geral[0].points > 0 && geral[0].points === geral[1].points;

  return (
    <div>
      <PageHeader
        title="Classificação"
        subtitle="Quem somar mais pontos até a final leva o prêmio."
      />

      {leaderTie && (
        <p className="mb-4 rounded-xl bg-copa-gold/10 px-3 py-2 text-sm text-copa-gold">
          Empate na liderança — em caso de empate ao final da Copa, o prêmio é
          dividido igualmente.
        </p>
      )}

      <RankingTabs tabs={tabs} />
    </div>
  );
}

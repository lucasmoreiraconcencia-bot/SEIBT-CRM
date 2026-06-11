import Link from "next/link";
import { Users, Pencil } from "lucide-react";
import { getGroups, getRoundLocks, getProfiles } from "@/lib/data";
import { isLocked, formatDeadline } from "@/lib/deadlines";
import { ROUND_LABELS } from "@/lib/scoring";
import { AdminTools } from "@/components/admin/AdminTools";
import { LockToggle } from "@/components/admin/LockToggle";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [groups, locks, profiles] = await Promise.all([
    getGroups(),
    getRoundLocks(),
    getProfiles(),
  ]);

  const active = profiles.filter((p) => p.is_active);
  const paid = active.filter((p) => p.is_paid);

  return (
    <div className="space-y-5">
      <PageHeader title="Administração" />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Participantes" value={active.length} />
        <Stat label="Pagos" value={paid.length} />
        <Stat label="Pendentes" value={active.length - paid.length} />
      </div>

      <AdminTools />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/participantes" className="card p-4 hover:bg-white/10">
          <h2 className="flex items-center gap-2 font-bold text-white">
            <Users size={18} strokeWidth={1.8} className="text-copa-gold" />
            Participantes
          </h2>
          <p className="mt-1 text-sm text-white/60">Pagamento, convites e remoção.</p>
        </Link>
        <Link href="/admin/resultados" className="card p-4 hover:bg-white/10">
          <h2 className="flex items-center gap-2 font-bold text-white">
            <Pencil size={18} strokeWidth={1.8} className="text-copa-gold" />
            Corrigir resultados
          </h2>
          <p className="mt-1 text-sm text-white/60">Ajuste manual (fallback da API).</p>
        </Link>
      </div>

      {/* Travas de fase */}
      <div className="card p-4">
        <h2 className="mb-3 font-bold text-white">Travas manuais</h2>

        <p className="mb-1 text-sm font-semibold text-white/70">Grupos</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {groups.map((g) => (
            <LockToggle
              key={g.letter}
              kind="group"
              id={g.letter}
              locked={isLocked(g.deadline, g.is_locked)}
              label={`Grupo ${g.letter}`}
            />
          ))}
        </div>

        <p className="mb-1 text-sm font-semibold text-white/70">Mata-mata</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {locks.map((l) => (
            <LockToggle
              key={l.round}
              kind="round"
              id={l.round}
              locked={isLocked(l.deadline, l.is_locked)}
              label={ROUND_LABELS[l.round]}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">
          As fases fecham sozinhas no horário do 1º jogo. Use os botões só para
          fechar/abrir manualmente antes disso.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-accent p-3 text-center">
      <div className="font-display text-3xl font-extrabold text-copa-gold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

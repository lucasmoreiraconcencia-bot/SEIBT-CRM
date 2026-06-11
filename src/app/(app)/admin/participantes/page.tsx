import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfiles } from "@/lib/data";
import { ParticipantRow } from "@/components/admin/ParticipantRow";
import { InviteLink } from "@/components/admin/InviteLink";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ParticipantesPage() {
  const profiles = await getProfiles();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={15} />
          Admin
        </Link>
      </div>
      <PageHeader title="Participantes" />

      <InviteLink />

      <div className="space-y-2">
        {profiles.map((p) => (
          <ParticipantRow key={p.id} p={p} />
        ))}
        {profiles.length === 0 && (
          <p className="card p-6 text-center text-white/50">
            Ninguém entrou ainda. Compartilhe o link de convite.
          </p>
        )}
      </div>
    </div>
  );
}

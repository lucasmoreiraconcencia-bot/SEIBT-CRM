"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { setPaid, setActive } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export function ParticipantRow({ p }: { p: Profile }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`card flex items-center gap-3 p-3 ${
        p.is_active ? "" : "opacity-50"
      }`}
    >
      {p.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full border border-white/15" />
      ) : (
        <div className="grid h-9 w-9 place-items-center rounded-full bg-copa-green font-bold">
          {(p.full_name ?? "?").charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">
          {p.full_name ?? "Sem nome"}
          {p.role === "admin" && (
            <span className="ml-2 rounded-full bg-copa-blue/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
              ADMIN
            </span>
          )}
        </p>
        <p className="truncate text-xs text-white/40">{p.email}</p>
      </div>

      <button
        onClick={() => startTransition(() => void setPaid(p.id, !p.is_paid))}
        disabled={pending}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
          p.is_paid
            ? "bg-emerald-400/15 text-emerald-400"
            : "bg-amber-400/15 text-amber-400"
        }`}
      >
        {p.is_paid && <Check size={12} />}
        {p.is_paid ? "Pago" : "Pendente"}
      </button>

      {p.role !== "admin" && (
        <button
          onClick={() => startTransition(() => void setActive(p.id, !p.is_active))}
          disabled={pending}
          className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
        >
          {p.is_active ? "Remover" : "Reativar"}
        </button>
      )}
    </div>
  );
}

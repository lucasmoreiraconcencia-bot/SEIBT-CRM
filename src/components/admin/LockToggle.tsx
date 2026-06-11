"use client";

import { useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";
import { lockGroup, lockRound } from "@/lib/actions/admin";
import type { RoundCode } from "@/lib/types";

export function LockToggle({
  kind,
  id,
  locked,
  label,
}: {
  kind: "group" | "round";
  id: string;
  locked: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (kind === "group") await lockGroup(id, !locked);
      else await lockRound(id as RoundCode, !locked);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center justify-between rounded-full px-3.5 py-2 text-sm transition ${
        locked
          ? "bg-red-400/15 text-red-400"
          : "bg-emerald-400/15 text-emerald-400"
      }`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-1 font-semibold">
        {locked ? <Lock size={13} /> : <LockOpen size={13} />}
        {locked ? "Fechado" : "Aberto"}
      </span>
    </button>
  );
}

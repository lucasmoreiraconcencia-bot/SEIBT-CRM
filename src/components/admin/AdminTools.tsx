"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Calculator } from "lucide-react";
import { runSync, runScore } from "@/lib/actions/admin";

export function AdminTools() {
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function call(fn: typeof runSync) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      setMsg(
        r.ok
          ? { ok: true, text: r.message ?? "Concluído." }
          : { text: r.error ?? "Erro." },
      );
    });
  }

  return (
    <div className="card p-4">
      <h2 className="mb-2 font-bold text-white">Sincronização</h2>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => call(runSync)} disabled={pending} className="btn-primary">
          <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
          {pending ? "Processando…" : "Sincronizar com a API"}
        </button>
        <button onClick={() => call(runScore)} disabled={pending} className="btn-ghost">
          <Calculator size={16} />
          Recalcular pontos
        </button>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>
          {msg.text}
        </p>
      )}
      <p className="mt-2 text-xs text-white/40">
        A sincronização busca times, jogos, classificação e resultados, e recalcula
        os pontos automaticamente.
      </p>
    </div>
  );
}

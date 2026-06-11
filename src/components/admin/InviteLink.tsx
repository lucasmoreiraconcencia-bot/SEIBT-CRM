"use client";

import { useState } from "react";

export function InviteLink() {
  const [copied, setCopied] = useState(false);
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card p-4">
      <h2 className="mb-1 font-bold text-white">Convidar participantes</h2>
      <p className="mb-2 text-sm text-white/60">
        Compartilhe este link. Quem entrar com o Google vira participante; você
        pode remover quem não foi convidado.
      </p>
      <div className="flex gap-2">
        <input readOnly value={url} className="input" />
        <button onClick={copy} className="btn-gold whitespace-nowrap">
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

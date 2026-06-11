"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  }

  return (
    <button onClick={signIn} disabled={loading} className="btn-gold w-full">
      {loading ? "Redirecionando…" : "Entrar com Google"}
    </button>
  );
}

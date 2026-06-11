"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
    >
      Sair
    </button>
  );
}

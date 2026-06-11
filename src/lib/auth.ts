// Helpers de autenticação/autorização para uso no SERVIDOR.
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Retorna o profile do usuário logado, ou null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

/** Exige usuário logado; redireciona para /login se não houver. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?removido=1");
  return profile;
}

/** Exige usuário admin; redireciona para a home se não for. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/ranking");
  return profile;
}

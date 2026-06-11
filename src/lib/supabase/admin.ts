// Cliente Supabase com SERVICE ROLE — IGNORA RLS.
// USAR SOMENTE EM CÓDIGO DE SERVIDOR CONFIÁVEL (rotas /api, server actions de admin,
// cálculo de pontos e revelação de palpites após o fechamento).
// NUNCA importar em componentes client.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

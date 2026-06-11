// Endpoint de sincronização com a API de futebol.
// - Vercel Cron chama via GET com header Authorization: Bearer ${CRON_SECRET}
// - Admin pode chamar manualmente pelo painel (botão usa server action runSync)
import { NextResponse } from "next/server";
import { syncFromApi } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await syncFromApi();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na sincronização" },
      { status: 500 },
    );
  }
}

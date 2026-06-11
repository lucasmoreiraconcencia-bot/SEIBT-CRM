// Troca o "code" do OAuth por uma sessão e promove o admin inicial.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ranking";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=1`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=1`);
  }

  // Promove o admin inicial (ADMIN_EMAIL) no primeiro acesso.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (user?.email && adminEmail && user.email.toLowerCase() === adminEmail) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

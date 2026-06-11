import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { LoginButton } from "@/components/LoginButton";
import { EmailLoginForm } from "@/components/EmailLoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { removido?: string; erro?: string };
}) {
  const profile = await getProfile();
  if (profile) redirect("/ranking");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="card-accent w-full max-w-md p-8 backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-26.png"
          alt="FIFA World Cup 2026"
          className="mx-auto mb-6 h-44 w-auto drop-shadow-[0_8px_24px_rgba(245,196,76,0.25)]"
        />

        <h1 className="font-display text-4xl font-extrabold uppercase italic tracking-wide text-white">
          Bolão Copa 2026
        </h1>
        <div className="ribbon mx-auto mt-2" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
          Canadá · Estados Unidos · México
        </p>

        <p className="mt-5 text-sm text-white/60">
          Entre com sua conta Google ou com e-mail e senha para palpitar e
          disputar com a galera.
        </p>

        {searchParams.removido && (
          <p className="mt-4 rounded-xl bg-red-400/15 px-3 py-2 text-sm text-red-400">
            Seu acesso foi removido pelo administrador.
          </p>
        )}
        {searchParams.erro && (
          <p className="mt-4 rounded-xl bg-red-400/15 px-3 py-2 text-sm text-red-400">
            Não foi possível entrar. Tente novamente.
          </p>
        )}

        <div className="mt-6">
          <LoginButton />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-widest text-white/40">ou</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <EmailLoginForm />

        <p className="mt-6 text-xs text-white/40">
          Acesso restrito aos participantes convidados.
        </p>
      </div>
    </main>
  );
}

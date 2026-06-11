"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered"))
    return "Este e-mail já tem conta. Use a opção Entrar.";
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "E-mail inválido.";
  if (m.includes("rate limit"))
    return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Não foi possível entrar. Verifique os dados e tente novamente.";
}

export function EmailLoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && name.trim().length < 2) {
      setError("Informe seu nome (é o que aparece no ranking).");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (err) {
        setError(translateError(err.message));
        setLoading(false);
        return;
      }
      if (!data.session) {
        setError(
          "Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.",
        );
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(translateError(err.message));
        setLoading(false);
        return;
      }
    }

    window.location.assign("/ranking");
  }

  return (
    <div className="text-left">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
        {(
          [
            ["signin", "Entrar"],
            ["signup", "Criar conta"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              mode === m
                ? "bg-copa-gold text-copa-ink"
                : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2">
        {mode === "signup" && (
          <input
            className="input"
            type="text"
            placeholder="Seu nome (aparece no ranking)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? "Entrando…"
            : mode === "signup"
              ? "Criar conta e entrar"
              : "Entrar"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-xl bg-red-400/15 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

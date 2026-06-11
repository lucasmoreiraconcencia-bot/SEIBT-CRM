"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Target,
  CalendarDays,
  Settings,
  ClipboardCheck,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const LINKS = [
  { href: "/ranking", label: "Ranking", Icon: Trophy },
  { href: "/palpites", label: "Palpitar", Icon: Target },
  { href: "/meus-palpites", label: "Meus", Icon: ClipboardCheck },
  { href: "/jogos", label: "Jogos", Icon: CalendarDays },
];

export function Nav({
  name,
  avatar,
  isAdmin,
}: {
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin", Icon: Settings }]
    : LINKS;

  return (
    <>
      {/* Topo */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-copa-navy/80 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          {/* fio tricolor na base do header */}
          <div
            className="absolute inset-x-0 bottom-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, #F5C44C 0%, #E0303B 50%, #2E6BFF 100%)",
            }}
          />
          <Link href="/ranking" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-26.png" alt="" className="h-9 w-auto" />
            <span className="font-display text-lg font-extrabold uppercase italic tracking-wide text-white">
              Bolão Copa 2026
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={name ?? "Você"}
                className="h-8 w-8 rounded-full border border-copa-gold/40"
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-copa-blue text-sm font-bold">
                {(name ?? "?").charAt(0)}
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Navegação inferior flutuante */}
      <nav className="fixed inset-x-3 bottom-3 z-20">
        <div className="mx-auto flex max-w-md items-stretch justify-around rounded-2xl border border-white/10 bg-copa-navy/90 px-1.5 py-1.5 shadow-card backdrop-blur-md">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-copa-gold/15 text-copa-gold"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={active ? "fill-copa-gold/25" : "fill-transparent"}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

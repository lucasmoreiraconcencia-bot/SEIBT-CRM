import type { Team } from "@/lib/types";

// Exibição de uma seleção: escudo oficial da federação (vem da API) + nome.
export function TeamPill({
  team,
  size = "md",
  className = "",
}: {
  team: Team | undefined | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const crestBox = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  if (!team) {
    return <span className={`text-white/40 ${className}`}>a definir</span>;
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {team.flag_url ? (
        <span className={`crest ${crestBox}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.flag_url}
            alt={team.name}
            className="h-full w-full object-contain"
          />
        </span>
      ) : null}
      <span className={`font-medium ${size === "sm" ? "text-sm" : ""}`}>
        {team.name}
      </span>
    </span>
  );
}

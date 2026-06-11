import { requireUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();

  return (
    <div className="min-h-dvh">
      <Nav
        name={profile.full_name}
        avatar={profile.avatar_url}
        isAdmin={profile.role === "admin"}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}

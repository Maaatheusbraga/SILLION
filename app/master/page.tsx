import { redirect } from "next/navigation";
import { getMasterSession } from "@/lib/master-auth";
import { MasterUserManager } from "@/components/MasterUserManager";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function MasterPage() {
  const session = await getMasterSession();
  if (!session) redirect("/master/login");

  return (
    <main className="relative min-h-dvh px-3 py-6 sm:px-6 sm:py-10">
      <div className="absolute right-3 top-4 sm:right-6">
        <ThemeToggle />
      </div>
      <MasterUserManager masterUsername={session.username} />
    </main>
  );
}

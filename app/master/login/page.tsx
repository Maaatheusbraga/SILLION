import { redirect } from "next/navigation";
import { getMasterSession } from "@/lib/master-auth";
import { MasterLoginForm } from "@/components/MasterLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function MasterLoginPage() {
  const session = await getMasterSession();
  if (session) redirect("/master");

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="sillion-display text-3xl font-bold text-ink sm:text-4xl">
            SILLION
          </p>
          <p className="mt-2 text-sm text-muted">Painel master · acesso restrito</p>
        </div>
        <MasterLoginForm />
      </div>
    </main>
  );
}

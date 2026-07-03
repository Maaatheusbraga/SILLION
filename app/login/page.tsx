import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/lista");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="animate-fade-up relative w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="sillion-display text-4xl font-bold tracking-tight text-ink">
            SILLION
          </p>
          <p className="mt-2 text-sm text-muted">
            CRM de prospecção — lista vira ação
          </p>
        </div>
        <LoginForm />
        <p className="mt-8 text-center text-xs text-muted">
          Acesso liberado pelo administrador da plataforma.
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Kanban, LayoutList, LogOut, Settings } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { LeadsProvider } from "@/lib/hooks/useLeads";
import { ImportButton } from "./ImportButton";
import { DatasetSwitcher } from "./DatasetSwitcher";
import { FollowUpAlert } from "./FollowUpAlert";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/lista", label: "Lista", icon: LayoutList },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <LeadsProvider>
      <AppShellInner user={user}>{children}</AppShellInner>
    </LeadsProvider>
  );
}

function AppShellInner({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-2 px-3 sm:h-14 sm:gap-4 sm:px-6">
          <Link
            href="/lista"
            className="sillion-display shrink-0 text-base font-bold text-ink sm:text-lg"
          >
            SILLION
          </Link>

          <nav
            className="flex items-center gap-0.5 sm:gap-1"
            aria-label="Principal"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                  title={label}
                >
                  <Icon size={16} aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden lg:block">
              <DatasetSwitcher />
            </div>
            <ImportButton />
            <FollowUpAlert />
            <ThemeToggle />
            <span
              className="hidden max-w-[120px] truncate text-sm text-muted xl:inline"
              title={user.displayName}
            >
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="Sair"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        <div className="border-t border-border-subtle px-3 py-2 lg:hidden">
          <DatasetSwitcher fullWidth />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}

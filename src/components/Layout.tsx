import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PgcAi } from "./PgcAi";

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col relative">
      <Header />
      <main className="flex-1 relative">
        <div key={pathname} className="pgc-page-transition">
          {children}
        </div>
      </main>
      <Footer />
      <PgcAi />
    </div>
  );
}

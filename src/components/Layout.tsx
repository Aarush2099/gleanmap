import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PgcAi } from "./PgcAi";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col relative">
      <div className="pgc-bg-ambient" aria-hidden="true" />
      <Header />
      <main className="flex-1 relative">{children}</main>
      <Footer />
      <PgcAi />
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PgcAi } from "./PgcAi";

function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [shown, setShown] = useState<{ pathname: string; node: ReactNode }>({ pathname, node: children });
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (pathname !== shown.pathname) {
      setPhase("exit");
      const t = window.setTimeout(() => {
        setShown({ pathname, node: children });
        setPhase("enter");
      }, 180);
      return () => window.clearTimeout(t);
    }
    setShown((s) => ({ ...s, node: children }));
  }, [pathname, children, shown.pathname]);

  return (
    <div key={shown.pathname + phase} className={phase === "enter" ? "page-enter" : "page-exit"}>
      {shown.node}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col relative">
      <Header />
      <main className="flex-1 relative">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <PgcAi />
    </div>
  );
}

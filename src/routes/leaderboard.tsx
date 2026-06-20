import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { universities } from "@/lib/challenges";
import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "University Index — PGC 2026" },
      { name: "description", content: "Live institutional rankings for PGC 2026 — Research and Impact indices across 800+ campuses." },
    ],
  }),
  component: Leaderboard,
});

// Deterministic mock deltas so rows look like a financial index without flicker.
function delta(seed: string, mode: "research" | "impact") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const base = ((h >>> 0) % 400) / 10 - 20; // -20.0 .. +20.0
  return mode === "impact" ? base * 0.6 + 1.2 : base;
}

function Leaderboard() {
  const [mode, setMode] = useState<"research" | "impact">("research");
  const sorted = [...universities].sort((a, b) => b[mode] - a[mode]);
  const top = sorted[0][mode];
  const total = sorted.reduce((s, u) => s + u[mode], 0);
  const avg = Math.round(total / sorted.length);

  return (
    <Layout>
      <section className="container-pgc py-12">
        {/* Index header strip */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="eyebrow">PGC / University Index</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Leaderboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sorted.length} reporting institutions · refreshed every 5 minutes · USD-equivalent points.
            </p>
          </div>
          <div className="flex border border-border">
            {(["research", "impact"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={[
                  "px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors",
                  mode === k ? "bg-foreground text-background" : "text-foreground hover:bg-secondary",
                ].join(" ")}
              >
                {k} index
              </button>
            ))}
          </div>
        </div>

        {/* Index stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          {[
            { l: "Index High", v: top.toLocaleString() },
            { l: "Index Average", v: avg.toLocaleString() },
            { l: "Total Volume", v: total.toLocaleString() },
            { l: "Phase", v: "OCT · Research" },
          ].map((s, i) => (
            <div key={s.l} className={["py-5 px-1", i > 0 && "md:border-l border-border"].filter(Boolean).join(" ")}>
              <p className="eyebrow">{s.l}</p>
              <p className="mt-1 text-2xl font-mono font-semibold tabular-nums">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Dense data table */}
        <div className="mt-0 overflow-x-auto">
          <table className="w-full text-sm font-mono tabular-nums">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left py-3 pr-4 w-12">#</th>
                <th className="text-left py-3 pr-4">Institution</th>
                <th className="text-left py-3 pr-4 hidden sm:table-cell">Region</th>
                <th className="text-right py-3 pr-4">{mode === "research" ? "Research" : "Impact"}</th>
                <th className="text-right py-3 pr-4 hidden md:table-cell">24h Δ</th>
                <th className="text-right py-3 pr-4 hidden md:table-cell">vs. Leader</th>
                <th className="text-left py-3 pl-4 w-[28%] hidden lg:table-cell">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => {
                const d = delta(u.name, mode);
                const pct = (u[mode] / top) * 100;
                const Trend = d > 0.5 ? ArrowUpRight : d < -0.5 ? ArrowDownRight : Minus;
                const trendColor = d > 0.5 ? "text-foreground" : d < -0.5 ? "text-destructive" : "text-muted-foreground";
                return (
                  <tr key={u.name} className="border-b border-border hover:bg-secondary/60 transition-colors">
                    <td className="py-3 pr-4 text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                    <td className="py-3 pr-4 font-sans font-semibold">{u.name}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">US-{u.state}</td>
                    <td className="py-3 pr-4 text-right font-semibold">{u[mode].toLocaleString()}</td>
                    <td className={`py-3 pr-4 text-right hidden md:table-cell ${trendColor}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Trend className="size-3.5" />
                        {d >= 0 ? "+" : ""}{d.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right hidden md:table-cell text-muted-foreground">
                      {pct === 100 ? "—" : `-${(100 - pct).toFixed(2)}%`}
                    </td>
                    <td className="py-3 pl-4 hidden lg:table-cell">
                      <div className="h-1 w-full bg-secondary">
                        <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          Data shown for prototype review · final scoring methodology pending PGC editorial sign-off.
        </p>
      </section>
    </Layout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getFlagThumb } from "@/lib/flags";


export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Global Leaderboard — PGC 2026" },
      { name: "description", content: "Live PGC 2026 leaderboard — top individual students and top countries, ranked by points earned through submissions." },
    ],
  }),
  component: Leaderboard,
});

type IndRow = { rank: number; id: string; full_name: string | null; country: string | null; points: number };
type CountryRow = { rank: number; country: string; total_points: number; participants: number };

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="py-3 pr-4">
              <div className="skeleton h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Leaderboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"individual" | "country">("individual");
  const [individual, setIndividual] = useState<IndRow[] | null>(null);
  const [countries, setCountries] = useState<CountryRow[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.rpc("individual_leaderboard", { _limit: 50, _offset: 0 });
      if (!cancel) setIndividual((data as IndRow[]) ?? []);
    })();
    (async () => {
      const { data } = await supabase.rpc("country_leaderboard");
      if (!cancel) setCountries((data as CountryRow[]) ?? []);
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (!user) { setMyRank(null); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.rpc("user_rank", { _user_id: user.id });
      if (!cancel) setMyRank(typeof data === "number" ? data : null);
    })();
    return () => { cancel = true; };
  }, [user]);

  const myCountry = profile?.country ?? null;
  const inTop50 = user && individual?.some(r => r.id === user.id);

  return (
    <Layout>
      <section className="container-pgc py-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="eyebrow">PGC 2026</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Global Leaderboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Points earned through verified PGC submissions. Ties broken by earliest first submission.
            </p>
          </div>
          <div className="flex border border-border">
            {([["individual","Individual"],["country","Country"]] as const).map(([k,label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={["px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors",
                  tab === k ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"].join(" ")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "individual" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="text-left py-3 pr-4 w-12">#</th>
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4 hidden sm:table-cell">Country</th>
                  <th className="text-right py-3 pr-4">Points</th>
                </tr>
              </thead>
              <tbody>
                {individual === null && <SkeletonRows cols={4} />}
                {individual?.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">No submissions yet — be the first!</td></tr>
                )}
                {individual?.map((r) => {
                  const mine = user && r.id === user.id;
                  return (
                    <tr key={r.id} className={`border-b border-border ${mine ? "bg-[var(--leaf)]/10" : "hover:bg-secondary/60"} transition-colors`}>
                      <td className="py-3 pr-4 text-muted-foreground">{String(r.rank).padStart(2, "0")}</td>
                      <td className="py-3 pr-4 font-semibold">{r.full_name ?? "Anonymous"}{mine && <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--leaf)]">you</span>}</td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                        {r.country ? (
                          <span className="inline-flex items-center gap-2">
                            <img src={getFlagThumb(r.country)} alt="" className="h-3 w-auto rounded-[2px]" />
                            {r.country}
                          </span>
                        ) : "—"}
                      </td>

                      <td className="py-3 pr-4 text-right font-semibold">{r.points.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {user && myRank && !inTop50 && (
              <div className="mt-6 p-4 border border-[var(--leaf)]/40 bg-[var(--leaf)]/5 rounded-lg text-sm">
                You are ranked <span className="font-semibold">#{myRank}</span> globally — keep submitting to climb!
              </div>
            )}
          </div>
        )}

        {tab === "country" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="text-left py-3 pr-4 w-12">#</th>
                  <th className="text-left py-3 pr-4">Country</th>
                  <th className="text-right py-3 pr-4">Participants</th>
                  <th className="text-right py-3 pr-4">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {countries === null && <SkeletonRows cols={4} />}
                {countries?.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">No submissions yet — be the first!</td></tr>
                )}
                {countries?.map((r) => {
                  const mine = myCountry && r.country === myCountry;
                  return (
                    <tr key={r.country} className={`border-b border-border ${mine ? "bg-[var(--leaf)]/10" : "hover:bg-secondary/60"} transition-colors`}>
                      <td className="py-3 pr-4 text-muted-foreground">{String(r.rank).padStart(2, "0")}</td>
                      <td className="py-3 pr-4 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <img src={getFlagThumb(r.country)} alt="" className="h-3 w-auto rounded-[2px]" />
                          {r.country}
                        </span>
                        {mine && <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--leaf)]">your country</span>}
                      </td>

                      <td className="py-3 pr-4 text-right text-muted-foreground">{r.participants.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right font-semibold">{r.total_points.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}

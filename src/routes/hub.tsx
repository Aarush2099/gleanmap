import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowRight, Microscope, Megaphone, FileDown, UserCircle2 } from "lucide-react";
import { getFlagThumb } from "@/lib/flags";


declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export const Route = createFileRoute("/hub")({
  head: () => ({ meta: [
    { title: "Your Hub — PGC 2026" },
    { name: "description", content: "Your personal Hub for Project Green Challenge — research, action, and your submissions." },
  ]}),
  component: Hub,
});

type Recent = {
  id: string; theme: string; title: string; phase: string; status: string;
  ai_feedback: string | null; submitted_at: string;
};

function Hub() {
  const { user, profile, loading } = useAuth();
  const [counts, setCounts] = useState({ research: 0, action: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: r }, { count: a }, { data: rec }] = await Promise.all([
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("phase", "october_research"),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("phase", "november_action"),
        supabase.from("submissions").select("id,theme,title,phase,status,ai_feedback,submitted_at").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(5),
      ]);
      setCounts({ research: r ?? 0, action: a ?? 0 });
      setRecent((rec as Recent[]) ?? []);
    })();
  }, [user]);

  if (loading) {
    return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <section className="container-pgc py-24 text-center max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your Hub awaits.</h1>
          <p className="mt-4 text-muted-foreground">Sign in to access your personalized Project Green Challenge dashboard.</p>
          <Link to="/auth" className="mt-8 inline-flex btn-pgc">Sign in to access your Hub <ArrowRight className="size-4" /></Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-pgc py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">// Your Hub</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">
              Welcome back, {profile?.full_name ?? "friend"}
              {profile?.country && (
                <span className="text-muted-foreground font-normal inline-flex items-center gap-2 ml-1">
                  · <img src={getFlagThumb(profile.country)} alt="" className="inline h-3.5 w-auto rounded-[2px]" />
                  {profile.country}
                </span>
              )}
            </h1>

          </div>
          <Link to="/profile" className="btn-outline-pgc text-sm"><UserCircle2 className="size-4" /> Profile</Link>
        </div>

        {!profile?.country && (
          <div className="mt-6 glass-card p-4 border-l-4 border-l-destructive">
            <p className="text-sm"><b>Add your country</b> in your <Link to="/profile" className="underline">profile</Link> so submissions get tagged correctly.</p>
          </div>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <Link to="/challenges" className="glass-card p-7 group hover:-translate-y-0.5 transition">
            <Microscope className="size-7 text-primary" />
            <h3 className="mt-4 text-2xl font-bold">Go to Research</h3>
            <p className="mt-1 text-sm text-muted-foreground">October · regional audits across 30 themes.</p>
            <p className="mt-4 font-mono text-sm">{counts.research} of 30 submitted</p>
            <div className="mt-3 h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (counts.research / 30) * 100)}%` }} /></div>
            <p className="mt-4 text-sm font-semibold text-primary-dark inline-flex items-center gap-1">Open Research <ArrowRight className="size-4" /></p>
          </Link>

          <Link to="/challenges" className="glass-card p-7 group hover:-translate-y-0.5 transition">
            <Megaphone className="size-7 text-primary" />
            <h3 className="mt-4 text-2xl font-bold">Go to Action</h3>
            <p className="mt-1 text-sm text-muted-foreground">November · policy-level changes informed by your research.</p>
            <p className="mt-4 font-mono text-sm">{counts.action} of 30 submitted</p>
            <div className="mt-3 h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (counts.action / 30) * 100)}%` }} /></div>
            <p className="mt-4 text-sm font-semibold text-primary-dark inline-flex items-center gap-1">Open Action <ArrowRight className="size-4" /></p>
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-xl font-bold">Recent activity</h2>
            <div className="mt-4 divide-y divide-border">
              {recent.length === 0 && <p className="text-sm text-muted-foreground py-3">No submissions yet — pick a theme to start.</p>}
              {recent.map((r: Recent) => (
                <div key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.theme} · {r.title}</p>
                    <span className={`text-[10px] uppercase font-bold ${r.status === "reviewed" ? "text-primary-dark" : "text-muted-foreground"}`}>{r.status}</span>
                  </div>
                  {r.ai_feedback && <p className="mt-1 text-xs text-muted-foreground line-clamp-1"><b>AI:</b> {r.ai_feedback}</p>}
                </div>
              ))}
            </div>
          </div>
          <Link to="/certificate" className="glass-card p-6 text-left hover:-translate-y-0.5 transition block">
            <FileDown className="size-6 text-primary" />
            <h3 className="mt-3 font-bold">Academic Certificate →</h3>
            <p className="mt-1 text-xs text-muted-foreground">Download your printable certificate of participation for credit recognition.</p>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

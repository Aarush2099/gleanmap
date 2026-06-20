import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Globe2, MapPin, GraduationCap, Mail, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your Profile — PGC 2026" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [counts, setCounts] = useState({ research: 0, action: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCountry(profile.country ?? "");
      setSchool(profile.school ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ count: r }, { count: a }] = await Promise.all([
        supabase.from("submissions").select("id", { count: "exact", head: true })
          .eq("user_id", profile.id).eq("phase", "october_research"),
        supabase.from("submissions").select("id", { count: "exact", head: true })
          .eq("user_id", profile.id).eq("phase", "november_action"),
      ]);
      setCounts({ research: r ?? 0, action: a ?? 0 });
    })();
  }, [profile]);

  async function save() {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: fullName, country, school })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
  }

  if (!profile) return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;

  return (
    <Layout>
      <section className="container-pgc py-12 max-w-3xl">
        <p className="eyebrow">// Profile</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Your account</h1>

        <div className="mt-8 glass-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="eyebrow flex items-center gap-1"><Globe2 className="size-3" /> Country *</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2.5 text-base font-semibold">
                <option value="">— Select —</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Your country tags every submission you make.</p>
            </div>
            <div>
              <label className="eyebrow flex items-center gap-1"><MapPin className="size-3" /> Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="eyebrow flex items-center gap-1"><Mail className="size-3" /> Email</label>
              <input disabled value={profile.email}
                className="mt-1 w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="eyebrow flex items-center gap-1"><GraduationCap className="size-3" /> School (optional)</label>
              <input value={school} onChange={(e) => setSchool(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="btn-pgc disabled:opacity-60">
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button onClick={signOut} className="btn-outline-pgc"><LogOut className="size-4" /> Sign out</button>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Link to="/challenges" className="glass-card p-5 hover:translate-y-[-2px] transition">
            <p className="eyebrow">Research submissions</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{counts.research} <span className="text-base text-muted-foreground font-normal">/ 30</span></p>
          </Link>
          <Link to="/challenges" className="glass-card p-5 hover:translate-y-[-2px] transition">
            <p className="eyebrow">Action submissions</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{counts.action} <span className="text-base text-muted-foreground font-normal">/ 30</span></p>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { PGC_DAYS } from "@/lib/challenges";
import { StampIcon } from "@/lib/stamps";
import { getFlagUrl } from "@/lib/flags";
import { CountryCombobox } from "@/components/CountryCombobox";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Climate Passport — PGC 2026" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [actionDays, setActionDays] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const passportRef = useRef<HTMLDivElement>(null);

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
      const { data } = await supabase
        .from("submissions")
        .select("day_number,phase")
        .eq("user_id", profile.id);
      const research = new Set<number>();
      const action = new Set<number>();
      (data ?? []).forEach((r: { day_number: number | null; phase: string }) => {
        if (r.day_number == null) return;
        if (r.phase === "october_research") research.add(r.day_number);
        if (r.phase === "november_action") action.add(r.day_number);
      });
      setCompletedDays(research);
      setActionDays(action);
    })();
  }, [profile]);

  async function save() {
    if (!profile) return;
    if (school.trim() === "") {
      setSchoolError("School is required");
      return;
    }
    setSchoolError(null);
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, country, school: school.trim() })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
  }

  async function exportPassport() {
    if (!passportRef.current) return;
    try {
      const dataUrl = await toPng(passportRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "pgc-passport-2026.png";
      a.click();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  if (!profile) return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;

  return (
    <Layout>
      <style>{`
        @keyframes holoshimmer { 0%,100% { opacity:0 } 50% { opacity:1 } }
        .holo-overlay { animation: holoshimmer 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .holo-overlay { animation: none !important; }
        }
      `}</style>

      <section className="container-pgc py-12">
        <p className="eyebrow">// Climate Passport</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Your passport</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stamps, stats, and identity for PGC 2026.</p>

        <div className="mt-8 grid md:grid-cols-[340px_1fr] gap-8 items-start">
          {/* ── LEFT: Passport card ── */}
          <div className="mx-auto md:mx-0 w-full max-w-[340px]">
            <div
              id="passport-card"
              ref={passportRef}
              className="relative overflow-hidden rounded-2xl text-white"
              style={{
                width: "100%",
                aspectRatio: "340 / 480",
                background:
                  "linear-gradient(160deg, hsl(150,35%,10%) 0%, hsl(155,30%,7%) 100%)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.06)",
              }}
            >
              {/* Texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 8px)",
                }}
              />

              {/* Top strip */}
              <div
                className="absolute top-0 inset-x-0 h-12 px-4 flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Project Green Challenge
                </span>
                <span className="text-[8px] font-mono text-white/40">2026</span>
              </div>

              {/* Flag + identity */}
              <div className="absolute inset-0 flex flex-col items-center text-center px-6 pt-[72px]">
                <img
                  src={getFlagUrl(profile.country, "w160")}
                  alt={`${profile.country ?? "Unknown"} flag`}
                  className="w-24 h-auto rounded-sm"
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
                  crossOrigin="anonymous"
                />
                <p className="mt-2 text-[11px] uppercase tracking-widest text-white/50">
                  {profile.country || "—"}
                </p>
                <p className="mt-3 text-[20px] font-bold leading-tight">
                  {profile.full_name || "Unnamed Student"}
                </p>
                <p className="mt-1 text-[11px] text-white/40">{profile.school || "—"}</p>
                <p className="mt-1 text-[10px] text-white/30 break-all px-3">{profile.email}</p>
              </div>

              {/* Holographic shimmer */}
              <div
                className="holo-overlay absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(120,255,180,0.04) 50%, rgba(120,255,200,0.06) 55%, transparent 65%)",
                }}
              />

              {/* Bottom strip */}
              <div
                className="absolute bottom-0 inset-x-0 h-10 px-4 flex items-center justify-between"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-[9px] font-mono text-white/40">
                  #{profile.participant_number ?? "——"}
                </span>
                <span className="text-[9px] tracking-widest" style={{ color: "rgba(34,197,94,0.7)" }}>
                  ● ● ● ● ●
                </span>
                <span className="text-[9px] font-mono text-white/30">OCT–NOV 2026</span>
              </div>
            </div>

            <button onClick={exportPassport} className="btn-outline-pgc justify-center w-full mt-3">
              <Download className="size-4" /> Export Passport
            </button>
            <Link to="/certificate" className="btn-outline-pgc justify-center w-full mt-2">
              Academic Certificate →
            </Link>
          </div>

          {/* ── RIGHT: Stamps + Stats + Edit ── */}
          <div className="space-y-8">
            {/* Stamps */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold">October Research</h2>
                <span className="text-sm font-bold" style={{ color: "rgb(34,197,94)" }}>
                  {completedDays.size} / 30
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PGC_DAYS.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <StampIcon
                      theme={d.theme}
                      completed={completedDays.has(d.day)}
                      isRestDay={d.isRestDay}
                      day={d.day}
                    />
                    <span className="text-[8px] font-mono text-white/30">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Points", value: (profile.points ?? 0).toLocaleString() },
                { label: "Research Days", value: `${completedDays.size} / 30` },
                { label: "Action Days", value: `${actionDays.size} / 30` },
                { label: "Participant #", value: `#${profile.participant_number ?? "——"}` },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{s.label}</p>
                  <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Edit form (always open) */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold mb-4">Edit Profile</h3>
              <div className="grid gap-4">
                <div>
                  <label className="eyebrow">Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="eyebrow">Country</label>
                  <div className="mt-1">
                    <CountryCombobox value={country} onChange={setCountry} />
                  </div>
                </div>
                <div>
                  <label className="eyebrow">
                    School <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    value={school}
                    onChange={(e) => {
                      setSchool(e.target.value);
                      if (schoolError) setSchoolError(null);
                    }}
                    aria-invalid={!!schoolError}
                    className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm"
                  />
                  {schoolError && (
                    <p role="alert" className="mt-1 text-xs text-destructive">{schoolError}</p>
                  )}
                </div>
                <div>
                  <label className="eyebrow">Email</label>
                  <input
                    disabled
                    readOnly
                    value={profile.email}
                    className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={save} disabled={busy} className="btn-pgc disabled:opacity-60">
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <button onClick={handleSignOut} className="btn-outline-pgc">
                    <LogOut className="size-4" /> Sign out
                  </button>
                  <Link to="/challenges" className="btn-outline-pgc">
                    Go to Challenges →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, ChevronDown, Download } from "lucide-react";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Climate Passport — PGC 2026" }] }),
  component: ProfilePage,
});

// ISO 3166-1 alpha-2 mapping for flag emoji
const COUNTRY_ISO: Record<string, string> = {
  "India": "IN", "Ghana": "GH", "Ecuador": "EC", "United States": "US",
  "United Kingdom": "GB", "Canada": "CA", "Australia": "AU", "Brazil": "BR",
  "Nigeria": "NG", "Kenya": "KE", "South Africa": "ZA", "Germany": "DE",
  "France": "FR", "Japan": "JP", "China": "CN", "Mexico": "MX",
  "Bangladesh": "BD", "Pakistan": "PK", "Philippines": "PH", "Indonesia": "ID",
  "Ethiopia": "ET", "Tanzania": "TZ", "Uganda": "UG", "Zambia": "ZM",
  "Costa Rica": "CR", "Colombia": "CO", "Peru": "PE", "Nepal": "NP",
  "Sri Lanka": "LK", "Thailand": "TH", "Vietnam": "VN", "Malaysia": "MY",
  "Singapore": "SG", "New Zealand": "NZ", "Ireland": "IE", "Sweden": "SE",
  "Netherlands": "NL", "Spain": "ES", "Italy": "IT", "Portugal": "PT",
  "Poland": "PL", "Jamaica": "JM", "Trinidad and Tobago": "TT", "Barbados": "BB",
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Argentina": "AR",
  "Armenia": "AM", "Austria": "AT", "Azerbaijan": "AZ", "Bahrain": "BH",
  "Belarus": "BY", "Belgium": "BE", "Bolivia": "BO", "Bulgaria": "BG",
  "Cambodia": "KH", "Cameroon": "CM", "Chile": "CL", "Croatia": "HR",
  "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK",
  "Dominican Republic": "DO", "Egypt": "EG", "El Salvador": "SV", "Estonia": "EE",
  "Finland": "FI", "Georgia": "GE", "Greece": "GR", "Guatemala": "GT",
  "Haiti": "HT", "Honduras": "HN", "Hungary": "HU", "Iceland": "IS",
  "Iran": "IR", "Iraq": "IQ", "Israel": "IL", "Ivory Coast": "CI",
  "Jordan": "JO", "Kazakhstan": "KZ", "Kuwait": "KW", "Kyrgyzstan": "KG",
  "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Libya": "LY",
  "Lithuania": "LT", "Luxembourg": "LU", "Madagascar": "MG", "Malawi": "MW",
  "Mali": "ML", "Malta": "MT", "Mauritius": "MU", "Moldova": "MD",
  "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ",
  "Myanmar": "MM", "Namibia": "NA", "Nicaragua": "NI", "Niger": "NE",
  "North Macedonia": "MK", "Norway": "NO", "Oman": "OM", "Palestine": "PS",
  "Panama": "PA", "Paraguay": "PY", "Qatar": "QA", "Romania": "RO",
  "Rwanda": "RW", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS",
  "Sierra Leone": "SL", "Slovakia": "SK", "Slovenia": "SI", "Somalia": "SO",
  "South Korea": "KR", "Sudan": "SD", "Switzerland": "CH", "Syria": "SY",
  "Taiwan": "TW", "Tajikistan": "TJ", "Togo": "TG", "Tunisia": "TN",
  "Turkey": "TR", "Turkmenistan": "TM", "Ukraine": "UA",
  "United Arab Emirates": "AE", "Uruguay": "UY", "Uzbekistan": "UZ",
  "Venezuela": "VE", "Yemen": "YE", "Zimbabwe": "ZW",
};

function flagEmoji(country: string | null | undefined): string {
  if (!country) return "🌍";
  const iso = COUNTRY_ISO[country];
  if (!iso) return "🌍";
  return String.fromCodePoint(...iso.toUpperCase().split("").map(c => 0x1f1e6 - 65 + c.charCodeAt(0)));
}

const THEMES_2026: { day: number; theme: string; rest: boolean }[] = [
  { day: 1, theme: "Why", rest: false }, { day: 2, theme: "Footprint", rest: false },
  { day: 3, theme: "Cities", rest: false }, { day: 4, theme: "Food", rest: false },
  { day: 5, theme: "Water", rest: false }, { day: 6, theme: "Fashion", rest: false },
  { day: 7, theme: "Waste", rest: false }, { day: 8, theme: "Oceans", rest: false },
  { day: 9, theme: "Climate Justice", rest: false }, { day: 10, theme: "Holiday", rest: true },
  { day: 11, theme: "Forests", rest: false }, { day: 12, theme: "Outdoors", rest: false },
  { day: 13, theme: "Indigenous Peoples", rest: false }, { day: 14, theme: "Body", rest: false },
  { day: 15, theme: "Soil", rest: false }, { day: 16, theme: "Holiday", rest: true },
  { day: 17, theme: "Food Waste", rest: false }, { day: 18, theme: "Wellness", rest: false },
  { day: 19, theme: "Connect", rest: false }, { day: 20, theme: "Plant-Based", rest: false },
  { day: 21, theme: "Fair Trade", rest: false }, { day: 22, theme: "Nature", rest: false },
  { day: 23, theme: "Purpose", rest: false }, { day: 24, theme: "Energy", rest: false },
  { day: 25, theme: "Advocate", rest: false }, { day: 26, theme: "Holiday", rest: true },
  { day: 27, theme: "Commitment", rest: false }, { day: 28, theme: "Activate", rest: false },
  { day: 29, theme: "Reflect", rest: false }, { day: 30, theme: "Inspire", rest: false },
];

function ProfilePage() {
  const { profile, refresh, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [counts, setCounts] = useState({ research: 0, action: 0 });
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
      const [{ count: r }, { count: a }, { data: rDays }] = await Promise.all([
        supabase.from("submissions").select("id", { count: "exact", head: true })
          .eq("user_id", profile.id).eq("phase", "october_research"),
        supabase.from("submissions").select("id", { count: "exact", head: true })
          .eq("user_id", profile.id).eq("phase", "november_action"),
        supabase.from("submissions").select("day_number")
          .eq("user_id", profile.id).eq("phase", "october_research"),
      ]);
      setCounts({ research: r ?? 0, action: a ?? 0 });
      setCompletedDays(new Set((rDays ?? []).map(x => x.day_number).filter((d): d is number => d != null)));
    })();
  }, [profile]);

  async function save() {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: fullName, country, school }).eq("id", profile.id);
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

  const flag = useMemo(() => flagEmoji(profile?.country), [profile?.country]);

  if (!profile) return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;

  return (
    <Layout>
      <style>{`
        @keyframes passportShimmer {
          0% { transform: translateX(-100%) rotate(30deg); }
          100% { transform: translateX(100%) rotate(30deg); }
        }
        .passport-shimmer::after {
          content: ""; position: absolute; inset: -50%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          transform: rotate(30deg); animation: passportShimmer 20s linear infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .passport-shimmer::after { animation: none; }
        }
        .passport-card {
          background:
            repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,0.018) 14px 15px),
            hsl(150 40% 12%);
          box-shadow: 0 20px 60px -20px hsl(150 60% 35% / 0.4), 0 0 0 1px hsl(150 30% 25% / 0.6);
        }
      `}</style>

      <section className="container-pgc py-12">
        <p className="eyebrow">// Climate Passport</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Your passport</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stamps, stats, and identity for PGC 2026.</p>

        <div className="mt-8 grid md:grid-cols-[320px_1fr] gap-8 items-start">
          {/* ---------- Section 1: Passport Card ---------- */}
          <div className="mx-auto md:mx-0 w-full max-w-[320px]">
            <div
              ref={passportRef}
              className="passport-card passport-shimmer relative overflow-hidden rounded-2xl text-white"
              style={{ aspectRatio: "3/4" }}
            >
              {/* Top strip */}
              <div className="absolute top-0 inset-x-0 px-4 py-2.5 flex items-center justify-between"
                   style={{ background: "hsl(150 45% 16%)", borderBottom: "1px solid hsl(150 30% 22%)" }}>
                <span className="text-[9px] font-bold tracking-[0.18em] uppercase">Project Green Challenge</span>
                <span className="text-[9px] font-mono opacity-80">2026</span>
              </div>

              {/* Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-8 pb-12 text-center">
                <div style={{ fontSize: 56, lineHeight: 1 }}>{flag}</div>
                <p className="mt-3 text-[13px] tracking-[0.16em] uppercase text-white/70">
                  {profile.country || "—"}
                </p>
                <p className="mt-3 text-[22px] font-bold leading-tight">
                  {profile.full_name || "Unnamed Student"}
                </p>
                <p className="mt-1.5 text-[11px] text-white/50 break-all px-2">{profile.email}</p>
              </div>

              {/* Bottom strip */}
              <div className="absolute bottom-0 inset-x-0 px-4 py-2.5 flex items-center justify-between font-mono text-[10px] text-white/60"
                   style={{ background: "hsl(150 45% 16%)", borderTop: "1px solid hsl(150 30% 22%)" }}>
                <span>#{profile.participant_number ?? "—"}</span>
                <span>Valid Oct–Nov 2026</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={exportPassport} className="btn-pgc justify-center">
                <Download className="size-4" /> Export as Image 📄
              </button>
              <Link to="/challenges" className="btn-outline-pgc justify-center">
                Go to Challenges →
              </Link>
            </div>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="space-y-8">
            {/* Section 2: Stamps */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold">October Research</h2>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {completedDays.size} / 30 days completed
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {THEMES_2026.map(({ day, theme, rest }) => {
                  const done = completedDays.has(day);
                  if (rest) {
                    return (
                      <div key={day} aria-label="Rest day" title="Rest day"
                        className="aspect-square rounded-md flex items-center justify-center text-white/30"
                        style={{ border: "1px dashed rgba(255,255,255,0.12)" }}>
                        <span className="text-base">○</span>
                      </div>
                    );
                  }
                  if (done) {
                    return (
                      <div key={day}
                        className="aspect-square rounded-md p-1.5 flex flex-col justify-between items-center text-center"
                        style={{
                          background: "hsl(150 40% 14% / 0.7)",
                          border: "1.5px solid hsl(150 60% 45%)",
                          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                        }}>
                        <span className="text-[9px] font-mono text-white/50">{day}</span>
                        <span className="text-[10px] font-bold text-white leading-tight">{theme}</span>
                        <span className="text-[10px]" style={{ color: "hsl(150 70% 55%)" }}>✓</span>
                      </div>
                    );
                  }
                  return (
                    <div key={day}
                      className="aspect-square rounded-md flex items-center justify-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.12)" }}>
                      <span className="text-[9px] font-mono text-white/40">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Points", value: (profile.points ?? 0).toLocaleString() },
                { label: "Research Days", value: `${counts.research} / 30` },
                { label: "Action Days", value: `${counts.action} / 30` },
                { label: "Participant #", value: profile.participant_number ?? "—" },
              ].map(s => (
                <div key={s.label} className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Section 4: Edit */}
            <div className="glass-card overflow-hidden">
              <button
                onClick={() => setEditOpen(o => !o)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                aria-expanded={editOpen}>
                <span className="font-semibold">Edit profile</span>
                <ChevronDown className={`size-4 transition-transform ${editOpen ? "rotate-180" : ""}`} />
              </button>
              {editOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="eyebrow">Full name</label>
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="eyebrow">Country</label>
                      <select value={country} onChange={(e) => setCountry(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm">
                        <option value="">— Select —</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{flagEmoji(c)} {c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="eyebrow">School (optional)</label>
                      <input value={school} onChange={(e) => setSchool(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="eyebrow">Email</label>
                      <input disabled value={profile.email}
                        className="mt-1 w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={save} disabled={busy} className="btn-pgc disabled:opacity-60">
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                    <button onClick={signOut} className="btn-outline-pgc">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

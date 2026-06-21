import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { generateAiFeedback } from "@/lib/submissions.functions";
import { generateCountryChallenge, approveCountryChallenge, editCountryChallenge } from "@/lib/country-challenges.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, ShieldAlert, Filter, Globe2 } from "lucide-react";
import { hasAdminAccess } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PGC 2026" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  user_id: string;
  country: string | null;
  phase: "october_research" | "november_action";
  day_number: number | null;
  theme: string;
  type: string;
  title: string;
  description: string | null;
  status: "submitted" | "reviewed";
  ai_feedback: string | null;
  ai_next_steps: string | null;
  submitted_at: string;
};

function AdminPage() {
  const { profile, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [fCountry, setFCountry] = useState("");
  const [fPhase, setFPhase] = useState<string>("");
  const [fStatus, setFStatus] = useState<string>("");
  const generate = useServerFn(generateAiFeedback);

  // Redirect non-admins after profile loads
  // This uses server-validated role from the profile, NOT client-side localStorage
  useEffect(() => {
    if (!loading && !hasAdminAccess(profile)) {
      toast.error("Not authorized to access admin panel");
      throw redirect({ to: "/hub" });
    }
  }, [loading, profile]);

  useEffect(() => {
    const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_access") === "true";
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id,user_id,country,phase,day_number,theme,type,title,description,status,ai_feedback,ai_next_steps,submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      else setRows((data as Row[]) ?? []);
    })();
  }, [profile]);

  const countries = useMemo(() => Array.from(new Set(rows.map(r => r.country).filter(Boolean))) as string[], [rows]);

  const filtered = rows.filter(r =>
    (!fCountry || r.country === fCountry) &&
    (!fPhase || r.phase === fPhase) &&
    (!fStatus || r.status === fStatus)
  );

  async function runOne(id: string) {
    setBusy(id);
    try {
      const res = await generate({ data: { submissionId: id } });
      setRows(prev => prev.map(r => r.id === id ? { ...r, ai_feedback: res.feedback, ai_next_steps: res.next_steps, status: "reviewed" } : r));
      toast.success("Feedback generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function runBulk() {
    const targets = filtered.filter(r => r.status !== "reviewed");
    if (!targets.length) return toast.message("Nothing unreviewed in this filter.");
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const r of targets) {
      try {
        const res = await generate({ data: { submissionId: r.id } });
        setRows(prev => prev.map(x => x.id === r.id ? { ...x, ai_feedback: res.feedback, ai_next_steps: res.next_steps, status: "reviewed" } : x));
        ok++;
      } catch { fail++; }
    }
    setBulkBusy(false);
    toast.success(`Done · ${ok} generated, ${fail} failed`);
  }

  if (loading) return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;
  if (profile?.role !== "admin") {
    return (
      <Layout>
        <div className="container-pgc py-24 max-w-md text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Not authorized</h1>
          <p className="mt-2 text-muted-foreground">This page is for PGC administrators only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-pgc py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="eyebrow">// Admin</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">PGC Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {rows.length} submissions shown</p>
          </div>
          <button onClick={runBulk} disabled={bulkBusy} className="btn-pgc disabled:opacity-60">
            <Sparkles className="size-4" /> {bulkBusy ? "Generating…" : "Generate AI for filter"}
          </button>
        </div>

        <CountryChallengesPanel />


        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="eyebrow flex items-center gap-1"><Filter className="size-3"/> Country</label>
            <select value={fCountry} onChange={e => setFCountry(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
              <option value="">All</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow">Phase</label>
            <select value={fPhase} onChange={e => setFPhase(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="october_research">October · Research</option>
              <option value="november_action">November · Action</option>
            </select>
          </div>
          <div>
            <label className="eyebrow">Status</label>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">Phase / Day</th>
                <th className="py-2 pr-3">Theme</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border align-top hover:bg-white/30">
                  <td className="py-3 pr-3 font-mono text-xs">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-3 font-semibold">{r.country ?? "—"}</td>
                  <td className="py-3 pr-3 text-xs">
                    <span className={r.phase === "october_research" ? "text-primary-dark" : "text-accent-foreground"}>
                      {r.phase === "october_research" ? "OCT" : "NOV"}
                    </span> · D{r.day_number ?? "?"}
                  </td>
                  <td className="py-3 pr-3">{r.theme}</td>
                  <td className="py-3 pr-3 max-w-[24rem]">
                    <div className="font-medium">{r.title}</div>
                    {r.description && <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>}
                    {r.ai_feedback && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-primary-dark">AI feedback</summary>
                        <p className="mt-1"><b>Feedback:</b> {r.ai_feedback}</p>
                        <p className="mt-1"><b>Next steps:</b> {r.ai_next_steps}</p>
                      </details>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === "reviewed" ? "bg-secondary text-primary-dark" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <button onClick={() => runOne(r.id)} disabled={busy === r.id}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-60 inline-flex items-center gap-1">
                      <Sparkles className="size-3" /> {busy === r.id ? "…" : r.ai_feedback ? "Regenerate" : "Generate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No submissions match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

const YEAR = 2026;

type CCRow = {
  year: number;
  country: string;
  day_number: number;
  theme: string;
  status: "pending" | "generating" | "ready" | "failed" | "approved";
  prompt: string | null;
  summary: string | null;
  title: string | null;
  brief: string | null;
  action_prompt: string | null;
  success_criteria: string | null;
  submission_count: number | null;
  small_sample: boolean | null;
  approved_at: string | null;
  generated_at: string | null;
};

function CountryChallengesPanel() {
  const [rows, setRows] = useState<CCRow[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [fCountry, setFCountry] = useState("");
  const [fDay, setFDay] = useState<string>("");
  const [fStatus, setFStatus] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; brief: string; action_prompt: string; success_criteria: string; summary: string }>({ title: "", brief: "", action_prompt: "", success_criteria: "", summary: "" });
  const gen = useServerFn(generateCountryChallenge);
  const approve = useServerFn(approveCountryChallenge);
  const editFn = useServerFn(editCountryChallenge);

  async function reload() {
    const { data } = await supabase
      .from("country_challenges")
      .select("year,country,day_number,theme,status,prompt,summary,title,brief,action_prompt,success_criteria,submission_count,small_sample,approved_at,generated_at")
      .eq("year", YEAR)
      .order("country").order("day_number");
    setRows((data as CCRow[]) ?? []);

    const { data: pool } = await supabase
      .from("submissions")
      .select("country,day_number")
      .eq("phase", "october_research")
      .not("country", "is", null);
    const cset = new Set<string>(); const dset = new Set<number>();
    (pool ?? []).forEach((r: { country: string | null; day_number: number | null }) => {
      if (r.country) cset.add(r.country);
      if (r.day_number) dset.add(r.day_number);
    });
    setCountries(Array.from(cset).sort());
    setDays(Array.from(dset).sort((a, b) => a - b));
  }
  useEffect(() => { reload(); }, []);

  async function runOne(country: string, day: number) {
    const key = `${country}-${day}`;
    setBusy(key);
    try {
      await gen({ data: { year: YEAR, country, day } });
      toast.success(`${country} · Day ${day} drafted`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function approveOne(country: string, day: number) {
    const key = `${country}-${day}`;
    setBusy(key);
    try {
      await approve({ data: { year: YEAR, country, day } });
      toast.success(`Approved — ${country} students can now see Day ${day}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  function startEdit(r: CCRow) {
    setEditKey(`${r.country}-${r.day_number}`);
    setEditDraft({
      title: r.title ?? "", brief: r.brief ?? "",
      action_prompt: r.action_prompt ?? r.prompt ?? "",
      success_criteria: r.success_criteria ?? "", summary: r.summary ?? "",
    });
  }

  async function saveEdit(country: string, day: number) {
    const key = `${country}-${day}`;
    setBusy(key);
    try {
      await editFn({ data: { year: YEAR, country, day, ...editDraft } });
      toast.success("Saved — re-approve to publish");
      setEditKey(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function runBulkForCountry() {
    if (!fCountry) return toast.message("Pick a country first.");
    const targetDays = days.length ? days : Array.from({ length: 30 }, (_, i) => i + 1);
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const d of targetDays) {
      try { await gen({ data: { year: YEAR, country: fCountry, day: d } }); ok++; }
      catch { fail++; }
    }
    setBulkBusy(false);
    toast.success(`${fCountry}: ${ok} drafted, ${fail} failed`);
    reload();
  }

  const visible = rows.filter(r =>
    (!fCountry || r.country === fCountry) &&
    (!fDay || r.day_number === Number(fDay)) &&
    (!fStatus || r.status === fStatus)
  );

  const placeholders = fCountry
    ? days.filter(d => !rows.some(r => r.country === fCountry && r.day_number === d) && (!fDay || d === Number(fDay)))
        .map(d => ({ country: fCountry, day_number: d, theme: "—", status: "pending" as const, prompt: null, summary: null, title: null, brief: null, action_prompt: null, success_criteria: null, submission_count: 0, small_sample: false, approved_at: null, generated_at: null, year: YEAR }))
    : [];
  const all = [...placeholders, ...visible];

  return (
    <div className="mt-8 glass-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="eyebrow inline-flex items-center gap-1"><Globe2 className="size-3" /> Country Challenges · November</p>
          <h2 className="mt-1 text-xl font-bold">AI-drafted, admin-approved country challenges</h2>
          <p className="text-xs text-muted-foreground mt-1">Drafts are anonymized at the source. Nothing reaches students until you Approve.</p>
        </div>
        <button onClick={runBulkForCountry} disabled={bulkBusy || !fCountry} className="btn-pgc disabled:opacity-60">
          <Sparkles className="size-4" /> {bulkBusy ? "Generating…" : `Generate all 30 for ${fCountry || "country"}`}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="eyebrow">Country</label>
          <select value={fCountry} onChange={e => setFCountry(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Day</label>
          <select value={fDay} onChange={e => setFDay(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Status</label>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="ready">Ready (awaiting approval)</option>
            <option value="approved">Approved · live</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {all.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No country challenges yet.</div>
        )}
        {all.map(r => {
          const key = `${r.country}-${r.day_number}`;
          const isEditing = editKey === key;
          const isLive = r.status === "approved";
          return (
            <div key={key} className="rounded-xl border border-border bg-white/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-2 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.country} · Day {r.day_number} · {r.theme}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isLive ? "bg-primary text-primary-foreground"
                      : r.status === "ready" ? "bg-secondary text-primary-dark"
                      : r.status === "failed" ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-muted-foreground"
                    }`}>{isLive ? "Live to students" : r.status}</span>
                    <span className="text-[11px] text-muted-foreground">{r.submission_count ?? 0} submission{(r.submission_count ?? 0) === 1 ? "" : "s"}</span>
                    {r.small_sample && (r.submission_count ?? 0) > 0 && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">⚠ Small sample</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => runOne(r.country, r.day_number)} disabled={busy === key}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-foreground disabled:opacity-60 inline-flex items-center gap-1">
                    <Sparkles className="size-3" /> {busy === key ? "…" : r.action_prompt || r.prompt ? "Regenerate" : "Generate"}
                  </button>
                  {(r.action_prompt || r.prompt) && !isEditing && (
                    <button onClick={() => startEdit(r)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-border">Edit</button>
                  )}
                  {(r.action_prompt || r.prompt) && !isLive && (
                    <button onClick={() => approveOne(r.country, r.day_number)} disabled={busy === key}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground disabled:opacity-60">
                      Approve & publish
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))} placeholder="Title" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.brief} onChange={e => setEditDraft(d => ({ ...d, brief: e.target.value }))} rows={2} placeholder="Brief" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.action_prompt} onChange={e => setEditDraft(d => ({ ...d, action_prompt: e.target.value }))} rows={2} placeholder="Action prompt" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.success_criteria} onChange={e => setEditDraft(d => ({ ...d, success_criteria: e.target.value }))} rows={2} placeholder="Success criteria" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.summary} onChange={e => setEditDraft(d => ({ ...d, summary: e.target.value }))} rows={3} placeholder="Synthesis / summary" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(r.country, r.day_number)} disabled={busy === key} className="btn-pgc text-xs disabled:opacity-60">Save</button>
                    <button onClick={() => setEditKey(null)} className="btn-outline-pgc text-xs">Cancel</button>
                  </div>
                </div>
              ) : (r.action_prompt || r.prompt || r.summary) ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="eyebrow">Synthesis</p>
                    <p className="mt-1 text-muted-foreground">{r.summary || "—"}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Draft November challenge</p>
                    {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
                    {r.brief && <p className="mt-1 text-muted-foreground"><b>Brief:</b> {r.brief}</p>}
                    <p className="mt-1"><b>Action:</b> {r.action_prompt || r.prompt}</p>
                    {r.success_criteria && <p className="mt-1 text-muted-foreground"><b>Success:</b> {r.success_criteria}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No draft yet — click Generate to synthesize this country's October research.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

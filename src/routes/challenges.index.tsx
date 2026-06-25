import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, CheckCircle2, FileText, Link2, MapPin, Plus, X, Sparkles, Coffee, Clock } from "lucide-react";
import { sanitizeUpload, UploadValidationError } from "@/lib/upload-safety";

export const Route = createFileRoute("/challenges/")({
  head: () => ({ meta: [
    { title: "Challenges & Research — PGC" },
    { name: "description", content: "October research informs AI-designed November action — same 30 themes, paired 1:1 per country." },
  ]}),
  component: ChallengesPage,
});

const YEAR = 2026;

type Theme = { day_number: number; theme: string; prompt: string | null; is_rest_day: boolean; is_milestone: boolean };
type RegionalContext = { context_headline: string; context_body: string; priority: string };

type Sub = {
  id: string;
  phase: "october_research" | "november_action";
  day_number: number | null;
  theme: string;
  type: string;
  title: string;
  description: string | null;
  location: string | null;
  key_findings: string | null;
  data_sources: string | null;
  source_links: string[] | null;
  attachment_paths: string[] | null;
  status: string;
  ai_feedback: string | null;
  ai_next_steps: string | null;
};

type CountryChallenge = {
  day_number: number;
  theme: string;
  status: "pending" | "generating" | "ready" | "failed" | "approved";
  prompt: string | null;
  summary: string | null;
  title: string | null;
  brief: string | null;
  action_prompt: string | null;
  success_criteria: string | null;
};

function ChallengesPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"research" | "action">("research");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [novChallenges, setNovChallenges] = useState<Record<number, CountryChallenge>>({});
  const [regional, setRegional] = useState<Record<number, RegionalContext>>({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("program_themes")
        .select("day_number,theme,prompt,is_rest_day,is_milestone")
        .eq("year", YEAR)
        .order("day_number");
      if (error) toast.error(error.message);
      else setThemes((data as Theme[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("id,phase,day_number,theme,type,title,description,location,key_findings,data_sources,source_links,attachment_paths,status,ai_feedback,ai_next_steps")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      setSubs((data as Sub[]) ?? []);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.country) return;
    (async () => {
      const { data } = await supabase
        .from("country_challenges")
        .select("day_number,theme,status,prompt,summary,title,brief,action_prompt,success_criteria")
        .eq("year", YEAR)
        .eq("country", profile.country!);
      const map: Record<number, CountryChallenge> = {};
      ((data as CountryChallenge[]) ?? []).forEach(c => { map[c.day_number] = c; });
      setNovChallenges(map);
    })();
  }, [user, profile?.country]);

  useEffect(() => {
    if (!user || !profile?.country) return;
    (async () => {
      const { data } = await supabase
        .from("regional_contexts")
        .select("day_number,context_headline,context_body,priority")
        .eq("country", profile.country!)
        .eq("year", YEAR);
      const map: Record<number, RegionalContext> = {};
      ((data as Array<{ day_number: number } & RegionalContext>) ?? []).forEach(r => { map[r.day_number] = r; });
      setRegional(map);
    })();
  }, [user, profile?.country]);


  return (
    <Layout>
      <section className="container-pgc py-12">
        <p className="eyebrow">// Challenges & Research</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">30 days of research. 30 days of action.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          <b>October — Research:</b> each day, see the theme and document how it shows up in your region.
          <br />
          <b>November — Action:</b> Day N is an AI-designed challenge built from what students in your country uncovered on October Day N.
        </p>

        <div className="mt-8 inline-flex p-1 rounded-full glass-card">
          {(["research", "action"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}>
              {k === "research" ? "Research · October" : "Action · November"}
            </button>
          ))}
        </div>

        {!user && (
          <div className="mt-8 glass-card p-6 max-w-xl">
            <p className="text-sm">
              <Link to="/auth" className="text-primary-dark font-semibold underline">Sign in or create an account</Link> to upload submissions.
            </p>
          </div>
        )}
        {user && !profile?.country && (
          <div className="mt-8 glass-card p-6 max-w-xl">
            <p className="text-sm">
              Add your country in <Link to="/profile" className="text-primary-dark font-semibold underline">your profile</Link> so your work is tagged to a region.
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {themes.map((t) => {
            const phase = tab === "research" ? "october_research" : "november_action";
            const mine = subs.filter(s => s.day_number === t.day_number && s.phase === phase);
            return tab === "research" ? (
              <ResearchCard key={`r-${t.day_number}`} theme={t} mySubs={mine} canSubmit={!!user} defaultLocation={profile?.country ?? ""}
                regional={regional[t.day_number]} country={profile?.country ?? null}
                onSaved={(s) => setSubs(prev => [s, ...prev])} />
            ) : (
              <ActionCard key={`a-${t.day_number}`} theme={t} mySubs={mine} myResearch={subs.filter(s => s.phase === "october_research" && s.day_number === t.day_number)}
                canSubmit={!!user && !!profile?.country} country={profile?.country ?? null}
                challenge={novChallenges[t.day_number]} onSaved={(s) => setSubs(prev => [s, ...prev])} />
            );
          })}
        </div>

      </section>
    </Layout>
  );
}

/* ----------------------------- RESEARCH (October) ----------------------------- */

function ResearchCard({ theme, mySubs, canSubmit, defaultLocation, regional, country, onSaved }: {
  theme: Theme; mySubs: Sub[]; canSubmit: boolean; defaultLocation: string;
  regional?: RegionalContext; country: string | null;
  onSaved: (s: Sub) => void;
}) {
  const [open, setOpen] = useState(false);

  if (theme.is_rest_day) {
    return (
      <div className="glass-card p-5 opacity-80">
        <p className="eyebrow">Day {theme.day_number}</p>
        <h3 className="mt-1 text-lg font-bold flex items-center gap-2"><Coffee className="size-4 text-muted-foreground" /> Rest day</h3>
        <p className="mt-1 text-sm text-muted-foreground">No research required today. Take a breather.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">
            Day {theme.day_number}
            {theme.is_milestone && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-full">★ Milestone</span>
            )}
          </p>
          <h3 className="mt-1 text-lg font-bold">{theme.theme}</h3>
          {theme.prompt && <p className="mt-1 text-sm text-muted-foreground italic">"{theme.prompt}"</p>}
        </div>
        {mySubs.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark">
            <CheckCircle2 className="size-4" /> {mySubs.length}
          </span>
        )}
      </div>

      {theme.is_milestone && (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
          <p className="text-xs font-bold text-amber-300 inline-flex items-center gap-1">
            ★ Milestone Day
            <span className="font-normal text-amber-200/80">— this submission will be reviewed for judging consideration</span>
          </p>
        </div>
      )}

      {regional && (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark">In {country}</span>
            {regional.priority === "critical" && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/30 px-1.5 py-0.5 rounded-full">Priority issue</span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold">{regional.context_headline}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{regional.context_body}</p>
        </div>
      )}


      {mySubs.length > 0 && (
        <div className="mt-3 space-y-2">
          {mySubs.map(s => <SubmittedSummary key={s.id} s={s} />)}
        </div>
      )}

      {canSubmit && !open && (
        <button onClick={() => setOpen(true)} className="mt-4 btn-outline-pgc text-sm">
          <Upload className="size-4" /> {mySubs.length ? "Submit another" : "Upload Regional Audit"}
        </button>
      )}

      {open && (
        <ResearchForm theme={theme} defaultLocation={defaultLocation} onCancel={() => setOpen(false)} onSaved={(s) => { onSaved(s); setOpen(false); }} />
      )}
    </div>
  );
}

function ResearchForm({ theme, defaultLocation, onCancel, onSaved }: {
  theme: Theme; defaultLocation: string;
  onCancel: () => void; onSaved: (s: Sub) => void;
}) {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState(defaultLocation);
  const [findings, setFindings] = useState("");
  const [sources, setSources] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    if (!findings.trim()) return toast.error("Add your key findings.");
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const raw of files) {
        let f: File;
        try { f = await sanitizeUpload(raw); }
        catch (e) {
          if (e instanceof UploadValidationError) { toast.error(e.message); setBusy(false); return; }
          throw e;
        }
        const path = `${user.id}/${crypto.randomUUID()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("submissions").upload(path, f, { contentType: f.type });
        if (upErr) throw upErr;
        paths.push(path);
      }
      const cleanLinks = links.map(l => l.trim()).filter(Boolean);
      const { data, error } = await supabase.from("submissions").insert({
        user_id: user.id,
        country: profile?.country ?? null,
        phase: "october_research",
        day_number: theme.day_number,
        theme: theme.theme,
        type: "regional_audit",
        title: `${theme.theme} — Day ${theme.day_number}`,
        location,
        key_findings: findings,
        data_sources: sources || null,
        source_links: cleanLinks,
        attachment_paths: paths,
        media_url: paths[0] ?? null,
      }).select("id,phase,day_number,theme,type,title,description,location,key_findings,data_sources,source_links,attachment_paths,status,ai_feedback,ai_next_steps").single();
      if (error) throw error;
      toast.success("Regional audit submitted");
      onSaved(data as Sub);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <div>
        <label className="eyebrow flex items-center gap-1"><MapPin className="size-3" /> Location / city</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, region"
          className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="eyebrow">Key findings *</label>
        <textarea value={findings} onChange={e => setFindings(e.target.value)} rows={4}
          placeholder={`What did you learn about "${theme.theme}" where you live?`}
          className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="eyebrow">Data sources (notes)</label>
        <textarea value={sources} onChange={e => setSources(e.target.value)} rows={2}
          placeholder="Reports, interviews, agencies you used…"
          className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="eyebrow">Source links</label>
        <div className="mt-1 space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input value={l} onChange={e => setLinks(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                placeholder="https://…" className="flex-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
              <button onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                className="px-2 rounded-lg border border-input bg-white/80"><X className="size-3" /></button>
            </div>
          ))}
          <button onClick={() => setLinks(prev => [...prev, ""])} className="text-xs text-primary-dark inline-flex items-center gap-1">
            <Plus className="size-3" /> Add link
          </button>
        </div>
      </div>
      <div>
        <label className="eyebrow">Photos / files</label>
        <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 block w-full text-xs text-muted-foreground" />
        {files.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">{files.length} file(s) selected</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} className="btn-pgc disabled:opacity-60">{busy ? "Submitting…" : "Submit audit"}</button>
        <button onClick={onCancel} className="btn-outline-pgc">Cancel</button>
      </div>
    </div>
  );
}

function SubmittedSummary({ s }: { s: Sub }) {
  return (
    <div className="rounded-lg border border-border bg-white/40 p-3">
      <p className="text-xs font-semibold flex items-center gap-1 text-primary-dark">
        <CheckCircle2 className="size-3.5" /> Submitted
      </p>
      {s.location && <p className="mt-1 text-xs"><b>Location:</b> {s.location}</p>}
      {s.key_findings && <p className="mt-1 text-xs line-clamp-3"><b>Findings:</b> {s.key_findings}</p>}
      {(s.source_links?.length ?? 0) > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {s.source_links!.length} source link(s) · {s.attachment_paths?.length ?? 0} file(s)
        </p>
      )}
      {s.ai_feedback && (
        <p className="mt-2 text-xs text-muted-foreground"><b>AI:</b> {s.ai_feedback}</p>
      )}
    </div>
  );
}

/* ----------------------------- ACTION (November) ----------------------------- */

function ActionCard({ theme, mySubs, myResearch, canSubmit, country, challenge, onSaved }: {
  theme: Theme; mySubs: Sub[]; myResearch: Sub[]; canSubmit: boolean; country: string | null;
  challenge?: CountryChallenge; onSaved: (s: Sub) => void;
}) {
  const [open, setOpen] = useState(false);

  if (theme.is_rest_day) {
    return (
      <div className="glass-card p-5 opacity-80">
        <p className="eyebrow">Day {theme.day_number}</p>
        <h3 className="mt-1 text-lg font-bold flex items-center gap-2"><Coffee className="size-4 text-muted-foreground" /> Rest day</h3>
      </div>
    );
  }

  const live = challenge?.status === "approved";

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">
            Day {theme.day_number}
            {theme.is_milestone && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-full">★ Milestone</span>
            )}
          </p>
          <h3 className="mt-1 text-lg font-bold">{theme.theme}</h3>
        </div>
        {mySubs.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark">
            <CheckCircle2 className="size-4" /> {mySubs.length}
          </span>
        )}
      </div>

      {!country ? (
        <div className="mt-3 rounded-lg border border-border bg-white/40 p-3 text-xs text-muted-foreground">
          Set your country in your profile to see your country's November challenge.
        </div>
      ) : live ? (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary-dark inline-flex items-center gap-1">
            <Sparkles className="size-3" /> {country} · {challenge!.title ?? "Your country's challenge"}
          </p>
          {challenge!.brief && <p className="mt-1 text-xs text-muted-foreground">{challenge!.brief}</p>}
          <p className="mt-2 text-sm font-medium">{challenge!.action_prompt ?? challenge!.prompt}</p>
          {challenge!.success_criteria && (
            <p className="mt-2 text-xs"><b>Success:</b> <span className="text-muted-foreground">{challenge!.success_criteria}</span></p>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-border bg-white/40 p-3 text-xs">
          <p className="font-semibold text-foreground inline-flex items-center gap-1">
            <Clock className="size-3" /> Your country's November challenge is being prepared
          </p>
          <p className="mt-1 text-muted-foreground">
            We're synthesizing what students in <b>{country}</b> uncovered for <b>{theme.theme}</b> in October. Check back soon.
          </p>
        </div>
      )}

      {mySubs.length > 0 && (
        <div className="mt-3 space-y-2">
          {mySubs.map(s => (
            <div key={s.id} className="rounded-lg border border-border bg-white/40 p-3">
              <p className="text-sm font-semibold flex items-center gap-2"><FileText className="size-3.5" /> {s.title}</p>
              {s.ai_feedback && <p className="mt-1 text-xs text-muted-foreground"><b>AI:</b> {s.ai_feedback}</p>}
            </div>
          ))}
        </div>
      )}

      {canSubmit && live && !open && (
        <button onClick={() => setOpen(true)} className="mt-4 btn-outline-pgc text-sm">
          <Upload className="size-4" /> Submit Policy Change
        </button>
      )}

      {open && (
        <ActionForm theme={theme} myResearch={myResearch}
          onCancel={() => setOpen(false)} onSaved={(s) => { onSaved(s); setOpen(false); }} />
      )}
    </div>
  );
}

function ActionForm({ theme, myResearch, onCancel, onSaved }: {
  theme: Theme; myResearch: Sub[];
  onCancel: () => void; onSaved: (s: Sub) => void;
}) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [linked, setLinked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    if (!title) return toast.error("Add a title");
    setBusy(true);
    try {
      let media_url: string | null = null;
      if (file) {
        let f: File;
        try { f = await sanitizeUpload(file); }
        catch (e) {
          if (e instanceof UploadValidationError) { toast.error(e.message); setBusy(false); return; }
          throw e;
        }
        const path = `${user.id}/${crypto.randomUUID()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("submissions").upload(path, f, { contentType: f.type });
        if (upErr) throw upErr;
        media_url = path;
      }
      const { data, error } = await supabase.from("submissions").insert({
        user_id: user.id,
        country: profile?.country ?? null,
        phase: "november_action",
        day_number: theme.day_number,
        theme: theme.theme,
        type: "policy_change",
        title, description, media_url,
      }).select("id,phase,day_number,theme,type,title,description,location,key_findings,data_sources,source_links,attachment_paths,status,ai_feedback,ai_next_steps").single();
      if (error) throw error;
      // submission_links table is not part of the current schema — link tracking handled in-memory only.
      onSaved(data as Sub);
      toast.success("Submitted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        className="w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your policy change / action…"
        className="w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm" />
      <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-xs text-muted-foreground" />
      {myResearch.length > 0 && (
        <div>
          <label className="eyebrow flex items-center gap-1"><Link2 className="size-3" /> Link to your October research</label>
          <select multiple value={linked} onChange={e => setLinked(Array.from(e.target.selectedOptions, o => o.value))}
            className="mt-1 w-full rounded-lg border border-input bg-white/80 px-2 py-2 text-xs min-h-[80px]">
            {myResearch.map(r => (
              <option key={r.id} value={r.id}>D{r.day_number} · {r.theme} — {r.location ?? "(no location)"}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} className="btn-pgc disabled:opacity-60">{busy ? "Submitting…" : "Submit"}</button>
        <button onClick={onCancel} className="btn-outline-pgc">Cancel</button>
      </div>
    </div>
  );
}

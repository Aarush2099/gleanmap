import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { generateAiFeedback } from "@/lib/submissions.functions";
import {
  generateCountryChallenge,
  approveCountryChallenge,
  editCountryChallenge,
} from "@/lib/country-challenges.functions";
import {
  setUserRole,
  adminUpdateProfile,
  upsertTheme,
  listAdminSettings,
  saveAdminSettings,
  listAuditLog,
} from "@/lib/admin.functions";
import { deleteUserById } from "@/lib/deleteUser.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles, ShieldAlert, Filter, Globe2, Pencil, Trash2, Save, X,
  Search, Download, Plus, Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getFlagThumb } from "@/lib/flags";
import { COUNTRIES } from "@/lib/countries";
import { CountryCombobox } from "@/components/CountryCombobox";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PGC 2026" }] }),
  component: AdminPage,
});

const YEAR = 2026;

function AdminPage() {
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      toast.error("Not authorized");
      throw redirect({ to: "/hub" });
    }
  }, [loading, profile]);

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
        <div className="border-b border-border pb-4">
          <p className="eyebrow">// Admin</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">PGC Command Center</h1>
        </div>

        <Tabs defaultValue="submissions" className="mt-6">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="settings">Site Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6"><SubmissionsTab profileId={profile.id} /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab currentAdminId={profile.id} /></TabsContent>
          <TabsContent value="challenges" className="mt-6"><ChallengesTab /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
          <TabsContent value="audit" className="mt-6"><AuditLogTab /></TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}

// ─── Submissions Tab ─────────────────────────────────────────────────────────

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

function SubmissionsTab({ profileId: _profileId }: { profileId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [fCountry, setFCountry] = useState("");
  const [fPhase, setFPhase] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [milestonesOnly, setMilestonesOnly] = useState(false);
  const generate = useServerFn(generateAiFeedback);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id,user_id,country,phase,day_number,theme,type,title,description,status,ai_feedback,ai_next_steps,submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      else setRows((data as Row[]) ?? []);
    })();
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(rows.map((r) => r.country).filter(Boolean))) as string[],
    [rows],
  );

  const filtered = rows.filter((r) =>
    (!fCountry || r.country === fCountry) &&
    (!fPhase || r.phase === fPhase) &&
    (!fStatus || r.status === fStatus) &&
    (!milestonesOnly || (r.day_number != null && [5, 10, 15, 20, 25, 30].includes(r.day_number))),
  );

  async function runOne(id: string) {
    setBusy(id);
    try {
      const res = await generate({ data: { submissionId: id } });
      setRows((prev) =>
        prev.map((r) => r.id === id
          ? { ...r, ai_feedback: res.feedback, ai_next_steps: res.next_steps, status: "reviewed" }
          : r,
        ),
      );
      toast.success("Feedback generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function runBulk() {
    const targets = filtered.filter((r) => r.status !== "reviewed");
    if (!targets.length) return toast.message("Nothing unreviewed in this filter.");
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const r of targets) {
      try {
        const res = await generate({ data: { submissionId: r.id } });
        setRows((prev) =>
          prev.map((x) => x.id === r.id
            ? { ...x, ai_feedback: res.feedback, ai_next_steps: res.next_steps, status: "reviewed" }
            : x,
          ),
        );
        ok++;
      } catch { fail++; }
    }
    setBulkBusy(false);
    toast.success(`Done · ${ok} generated, ${fail} failed`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} of {rows.length} submissions</p>
        <button onClick={runBulk} disabled={bulkBusy} className="btn-pgc disabled:opacity-60">
          <Sparkles className="size-4" /> {bulkBusy ? "Generating…" : "Generate AI for filter"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="eyebrow flex items-center gap-1"><Filter className="size-3" /> Country</label>
          <select value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Phase</label>
          <select value={fPhase} onChange={(e) => setFPhase(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="october_research">October · Research</option>
            <option value="november_action">November · Action</option>
          </select>
        </div>
        <div>
          <label className="eyebrow">Status</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium pb-2">
          <input type="checkbox" checked={milestonesOnly} onChange={(e) => setMilestonesOnly(e.target.checked)} />
          ★ Milestones only
        </label>
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
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border align-top hover:bg-white/30">
                <td className="py-3 pr-3 font-mono text-xs">{new Date(r.submitted_at).toLocaleDateString()}</td>
                <td className="py-3 pr-3 font-semibold">
                  {r.country ? (
                    <span className="inline-flex items-center gap-2">
                      <img src={getFlagThumb(r.country)} alt="" className="h-3 w-auto rounded-[2px]" />
                      {r.country}
                    </span>
                  ) : "—"}
                </td>
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
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  country: string | null;
  school: string | null;
  role: "student" | "admin";
  points: number | null;
  participant_number: string | null;
  created_at: string;
};

function UsersTab({ currentAdminId }: { currentAdminId: string }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "student" | "admin">("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ full_name: string; country: string; school: string; role: "student" | "admin" }>({
    full_name: "", country: "", school: "", role: "student",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const deleteFn = useServerFn(deleteUserById);
  const setRoleFn = useServerFn(setUserRole);
  const updateFn = useServerFn(adminUpdateProfile);

  async function reload() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,country,school,points,participant_number,created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const adminSet = new Set(
      (roles ?? []).filter((r: { role: string }) => r.role === "admin").map((r: { user_id: string }) => r.user_id),
    );
    setRows(
      (data ?? []).map((u): UserRow => ({
        ...u,
        role: adminSet.has(u.id) ? "admin" : "student",
      })),
    );
  }
  useEffect(() => { reload(); }, []);

  const filtered = rows.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.country ?? "").toLowerCase().includes(q) ||
      (u.school ?? "").toLowerCase().includes(q)
    );
  });

  function startEdit(u: UserRow) {
    setEditing(u.id);
    setDraft({ full_name: u.full_name ?? "", country: u.country ?? "", school: u.school ?? "", role: u.role });
  }

  async function saveEdit(u: UserRow) {
    if (draft.school.trim() === "") return toast.error("School is required");
    setBusy(u.id);
    try {
      await updateFn({ data: { userId: u.id, full_name: draft.full_name.trim(), country: draft.country, school: draft.school.trim() } });
      if (draft.role !== u.role) {
        await setRoleFn({ data: { userId: u.id, role: draft.role } });
      }
      toast.success("User updated");
      setEditing(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  async function remove(u: UserRow) {
    if (u.id === currentAdminId) return toast.error("Cannot delete your own account.");
    const ok = window.confirm(
      `Remove ${u.full_name ?? u.email}? This will delete their account, all submissions, achievements, and storage files. This cannot be undone.`,
    );
    if (!ok) return;
    setBusy(u.id);
    try {
      await deleteFn({ data: { userId: u.id } });
      toast.success("User removed");
      setRows((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  function exportCsv() {
    const cols = ["Name", "Email", "Country", "School", "Role", "Points", "Participant #", "Joined"];
    const csv = [
      cols.join(","),
      ...filtered.map((u) =>
        [
          u.full_name ?? "", u.email, u.country ?? "", u.school ?? "",
          u.role, u.points ?? 0, u.participant_number ?? "",
          new Date(u.created_at).toISOString(),
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pgc-users.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 opacity-60" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, country, school…"
              className="pl-7 pr-3 py-2 text-sm rounded-lg border border-input bg-white/80 min-w-[280px]"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "" | "student" | "admin")}
            className="rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <button onClick={exportCsv} className="btn-outline-pgc text-sm">
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3 w-10">Flag</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Country</th>
              <th className="py-2 pr-3">School</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3 text-right">Points</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isEditing = editing === u.id;
              return (
                <tr key={u.id} className="border-b border-border align-top hover:bg-white/30">
                  <td className="py-3 pr-3">
                    {u.country && <img src={getFlagThumb(u.country)} alt="" className="h-3 w-auto rounded-[2px]" />}
                  </td>
                  <td className="py-3 pr-3 font-medium">
                    {isEditing ? (
                      <input value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                        className="rounded border border-input bg-white px-2 py-1 text-sm w-full" />
                    ) : u.full_name ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{u.email}</td>
                  <td className="py-3 pr-3 text-xs">
                    {isEditing ? (
                      <div className="min-w-[180px]">
                        <CountryCombobox value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })} />
                      </div>
                    ) : u.country ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {isEditing ? (
                      <input value={draft.school} required onChange={(e) => setDraft({ ...draft, school: e.target.value })}
                        className="rounded border border-input bg-white px-2 py-1 text-sm w-full" />
                    ) : u.school ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {isEditing ? (
                      <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as "student" | "admin" })}
                        className="rounded border border-input bg-white px-2 py-1 text-sm">
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">{(u.points ?? 0).toLocaleString()}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(u)} disabled={busy === u.id} className="p-1.5 rounded hover:bg-primary/10 text-primary-dark" title="Save">
                          <Save className="size-4" />
                        </button>
                        <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-muted ml-1" title="Cancel">
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-muted" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => remove(u)} disabled={busy === u.id || u.id === currentAdminId}
                          className="p-1.5 rounded hover:bg-destructive/10 text-destructive ml-1 disabled:opacity-40" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No users match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Challenges Tab (Themes + CountryChallengesPanel) ────────────────────────

type ThemeRow = {
  year: number;
  day_number: number;
  theme: string;
  prompt: string;
  is_rest_day: boolean;
};

function ChallengesTab() {
  const [sub, setSub] = useState<"themes" | "regional" | "country">("themes");
  const [rcCount, setRcCount] = useState<{ rows: number; countries: number }>({ rows: 0, countries: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("regional_contexts").select("country");
      const rows = data ?? [];
      setRcCount({ rows: rows.length, countries: new Set(rows.map((r: { country: string }) => r.country)).size });
    })();
  }, []);

  return (
    <div>
      <div className="inline-flex gap-1 p-1 rounded-full glass-card mb-6">
        {([
          ["themes", "Theme Editor"],
          ["regional", `Regional Contexts${rcCount.rows ? ` · ${rcCount.rows}/${rcCount.countries}` : ""}`],
          ["country", "Country Challenges"],
        ] as const).map(([k, lbl]) => (
          <button key={k} onClick={() => setSub(k as typeof sub)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${sub === k ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}>
            {lbl}
          </button>
        ))}
      </div>
      {sub === "themes" && <ThemeEditor />}
      {sub === "regional" && <RegionalContextsPanel onCountChange={setRcCount} />}
      {sub === "country" && <CountryChallengesPanel />}
    </div>
  );
}

type RegionalContextRow = {
  id: string;
  country: string;
  theme: string;
  day_number: number;
  year: number;
  context_headline: string;
  context_body: string;
  priority: "critical" | "high" | "medium" | "low";
};

function RegionalContextsPanel({ onCountChange }: { onCountChange: (c: { rows: number; countries: number }) => void }) {
  const [rows, setRows] = useState<RegionalContextRow[]>([]);
  const [themes, setThemes] = useState<{ day_number: number; theme: string }[]>([]);
  const [fCountry, setFCountry] = useState("");
  const [fDay, setFDay] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const emptyDraft: Omit<RegionalContextRow, "id"> = {
    country: "", theme: "", day_number: 1, year: YEAR,
    context_headline: "", context_body: "", priority: "medium",
  };
  const [draft, setDraft] = useState<Omit<RegionalContextRow, "id">>(emptyDraft);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const { data } = await supabase
      .from("regional_contexts")
      .select("id,country,theme,day_number,year,context_headline,context_body,priority")
      .order("country").order("day_number");
    const list = (data as RegionalContextRow[]) ?? [];
    setRows(list);
    onCountChange({ rows: list.length, countries: new Set(list.map(r => r.country)).size });
  }
  useEffect(() => {
    reload();
    (async () => {
      const { data } = await supabase.from("program_themes").select("day_number,theme").eq("year", YEAR).order("day_number");
      setThemes((data as { day_number: number; theme: string }[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNew() {
    setEditing("new");
    setDraft({ ...emptyDraft });
  }
  function startEdit(r: RegionalContextRow) {
    setEditing(r.id);
    setDraft({ country: r.country, theme: r.theme, day_number: r.day_number, year: r.year, context_headline: r.context_headline, context_body: r.context_body, priority: r.priority });
  }

  async function save() {
    if (!draft.country || !draft.context_headline.trim() || !draft.context_body.trim()) {
      return toast.error("Country, headline, and body are required.");
    }
    const themeName = themes.find(t => t.day_number === draft.day_number)?.theme ?? draft.theme ?? "";
    setBusy(true);
    try {
      const payload = { ...draft, theme: themeName };
      const { error } = await supabase
        .from("regional_contexts")
        .upsert(payload, { onConflict: "country,day_number,year" });
      if (error) throw error;
      toast.success("Regional context saved");
      setEditing(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  async function remove(r: RegionalContextRow) {
    if (!window.confirm(`Remove regional context for ${r.country} Day ${r.day_number}?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("regional_contexts").delete().eq("id", r.id);
      if (error) throw error;
      toast.success("Removed");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  const visible = rows.filter(r => (!fCountry || r.country === fCountry) && (!fDay || r.day_number === Number(fDay)));
  const uniqueCountries = Array.from(new Set(rows.map(r => r.country))).sort();

  return (
    <div className="glass-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="eyebrow">// Regional Contexts</p>
          <h2 className="mt-1 text-xl font-bold">Country-specific research angles</h2>
          <p className="text-xs text-muted-foreground mt-1">Shown to students from this country on the matching day. Also fed into AI when generating that country's November challenge.</p>
        </div>
        <button onClick={startNew} className="btn-pgc text-sm"><Plus className="size-4" /> Add new</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="eyebrow">Country</label>
          <select value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Day</label>
          <select value={fDay} onChange={(e) => setFDay(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground ml-auto">{visible.length} of {rows.length} contexts</p>
      </div>

      {editing && (
        <div className="mt-4 p-4 rounded-lg border border-primary/40 bg-primary/5">
          <p className="eyebrow">{editing === "new" ? "New regional context" : "Editing"}</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="eyebrow">Country</label>
              <CountryCombobox value={draft.country} onChange={(v) => setDraft(d => ({ ...d, country: v }))} />
            </div>
            <div>
              <label className="eyebrow">Day (1–30)</label>
              <select value={draft.day_number} onChange={(e) => setDraft(d => ({ ...d, day_number: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm">
                {themes.map(t => <option key={t.day_number} value={t.day_number}>Day {t.day_number} · {t.theme}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="eyebrow">Context headline</label>
            <input value={draft.context_headline} onChange={(e) => setDraft(d => ({ ...d, context_headline: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
          </div>
          <div className="mt-3">
            <label className="eyebrow">Context body</label>
            <textarea rows={3} value={draft.context_body} onChange={(e) => setDraft(d => ({ ...d, context_body: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
          </div>
          <div className="mt-3">
            <label className="eyebrow">Priority</label>
            <select value={draft.priority} onChange={(e) => setDraft(d => ({ ...d, priority: e.target.value as RegionalContextRow["priority"] }))}
              className="mt-1 rounded-lg border border-input bg-white px-3 py-2 text-sm">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy} className="btn-pgc text-xs disabled:opacity-60"><Save className="size-3.5" /> Save</button>
            <button onClick={() => setEditing(null)} className="btn-outline-pgc text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3">Country</th>
              <th className="py-2 pr-3">Day</th>
              <th className="py-2 pr-3">Theme</th>
              <th className="py-2 pr-3">Headline</th>
              <th className="py-2 pr-3">Priority</th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-white/30">
                <td className="py-3 pr-3 font-semibold inline-flex items-center gap-2">
                  <img src={getFlagThumb(r.country)} alt="" className="h-3 w-auto rounded-[2px]" />
                  {r.country}
                </td>
                <td className="py-3 pr-3 text-xs font-mono">D{r.day_number}</td>
                <td className="py-3 pr-3 text-xs">{r.theme}</td>
                <td className="py-3 pr-3 text-xs max-w-[24rem]"><div className="line-clamp-2">{r.context_headline}</div></td>
                <td className="py-3 pr-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.priority === "critical" ? "bg-destructive/20 text-destructive"
                      : r.priority === "high" ? "bg-amber-100 text-amber-900"
                      : r.priority === "medium" ? "bg-muted text-muted-foreground"
                      : "bg-secondary text-primary-dark"
                  }`}>{r.priority}</span>
                </td>
                <td className="py-3 pr-3 text-right">
                  <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-muted" title="Edit"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-muted text-destructive" title="Delete"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No regional contexts yet — click "Add new" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ThemeEditor() {
  const [rows, setRows] = useState<ThemeRow[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<ThemeRow>({ year: YEAR, day_number: 0, theme: "", prompt: "", is_rest_day: false });
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const upsert = useServerFn(upsertTheme);

  async function reload() {
    const { data, error } = await supabase
      .from("program_themes")
      .select("year,day_number,theme,prompt,is_rest_day")
      .eq("year", YEAR)
      .order("day_number");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as ThemeRow[]);
  }
  useEffect(() => { reload(); }, []);

  function startEdit(r: ThemeRow) {
    setEditing(r.day_number);
    setDraft({ ...r });
  }

  async function save() {
    if (!draft.theme.trim() || !draft.prompt.trim() || !draft.day_number) {
      return toast.error("Day, theme, and prompt are required");
    }
    setBusy(true);
    try {
      await upsert({ data: { ...draft, theme: draft.theme.trim(), prompt: draft.prompt.trim() } });
      toast.success("Theme saved");
      setEditing(null); setAdding(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-end justify-between border-b border-border pb-3">
        <div>
          <p className="eyebrow">// Theme Editor</p>
          <h2 className="mt-1 text-xl font-bold">PGC {YEAR} Themes</h2>
          <p className="text-xs text-muted-foreground mt-1">Edit the daily theme + research prompt students see.</p>
        </div>
        <button onClick={() => { setAdding(true); setEditing(null); setDraft({ year: YEAR, day_number: rows.length + 1, theme: "", prompt: "", is_rest_day: false }); }}
          className="btn-outline-pgc text-sm">
          <Plus className="size-4" /> Add theme
        </button>
      </div>

      {adding && <ThemeForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setAdding(false)} busy={busy} isNew />}

      <div className="mt-4 divide-y divide-border">
        {rows.map((r) => {
          const isEditing = editing === r.day_number;
          if (isEditing) {
            return (
              <div key={r.day_number} className="py-3">
                <ThemeForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditing(null)} busy={busy} />
              </div>
            );
          }
          return (
            <div key={r.day_number} className="py-3 flex items-start gap-3">
              <div className="font-mono text-xs text-muted-foreground w-12 pt-1">Day {r.day_number}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.theme}</span>
                  {r.is_rest_day && <span className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Rest</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.prompt}</p>
              </div>
              <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-muted" title="Edit"><Pencil className="size-4" /></button>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No themes yet — add one or seed program_themes.</p>
        )}
      </div>
    </div>
  );
}

function ThemeForm({
  draft, setDraft, onSave, onCancel, busy, isNew = false,
}: {
  draft: ThemeRow;
  setDraft: (r: ThemeRow) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  isNew?: boolean;
}) {
  return (
    <div className={isNew ? "mt-4 p-4 rounded-lg border border-border bg-white/40" : ""}>
      <div className="grid sm:grid-cols-[80px_1fr_120px] gap-3 items-end">
        <div>
          <label className="eyebrow">Day</label>
          <input type="number" min={1} value={draft.day_number} onChange={(e) => setDraft({ ...draft, day_number: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="eyebrow">Theme</label>
          <input value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
            className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm mt-6">
          <input type="checkbox" checked={draft.is_rest_day} onChange={(e) => setDraft({ ...draft, is_rest_day: e.target.checked })} />
          Rest day
        </label>
      </div>
      <div className="mt-3">
        <label className="eyebrow">Research prompt</label>
        <textarea rows={3} value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn-pgc text-xs disabled:opacity-60"><Save className="size-3.5" /> Save</button>
        <button onClick={onCancel} className="btn-outline-pgc text-xs">Cancel</button>
      </div>
    </div>
  );
}

// ─── Site Settings Tab ───────────────────────────────────────────────────────

type SettingDef = { key: string; label: string; type: "text" | "number" | "textarea" | "date" | "toggle"; default: string };
const SETTING_DEFS: SettingDef[] = [
  { key: "program_year", label: "Program Year", type: "number", default: "2026" },
  { key: "october_start", label: "October Start Date", type: "date", default: "2026-10-01" },
  { key: "november_start", label: "November Start Date", type: "date", default: "2026-11-01" },
  { key: "challenge_window_hours", label: "Challenge Window (hours)", type: "number", default: "24" },
  { key: "max_upload_mb", label: "Max File Upload (MB)", type: "number", default: "20" },
  { key: "welcome_message", label: "Welcome Message", type: "textarea", default: "" },
  { key: "registration_open", label: "Registration Open", type: "toggle", default: "true" },
  { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle", default: "false" },
];

function SettingsTab() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(SETTING_DEFS.map((s) => [s.key, s.default])),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const load = useServerFn(listAdminSettings);
  const save = useServerFn(saveAdminSettings);

  useEffect(() => {
    (async () => {
      try {
        const res = await load();
        setMissing(res.missing);
        const v: Record<string, string> = { ...values };
        res.settings.forEach((s) => { v[s.key] = s.value; });
        setValues(v);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave() {
    setBusy(true);
    try {
      const entries = SETTING_DEFS.map((d) => ({ key: d.key, value: values[d.key] ?? d.default }));
      const res = await save({ data: { entries } });
      setSavedAt(res.saved_at);
      setMissing(false);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="glass-card p-5 max-w-2xl">
      <p className="eyebrow">// Site Settings</p>
      <h2 className="mt-1 text-xl font-bold">Global configuration</h2>
      {missing && (
        <p className="mt-3 text-xs p-3 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
          ⚠ The <code>admin_settings</code> table doesn't exist yet — saving will create rows there after the next migration runs.
        </p>
      )}
      <div className="mt-5 grid gap-4">
        {SETTING_DEFS.map((d) => (
          <div key={d.key}>
            <label className="eyebrow">{d.label}</label>
            {d.type === "toggle" ? (
              <label className="mt-1 inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values[d.key] === "true"}
                  onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.checked ? "true" : "false" }))}
                />
                <span className="text-sm">{values[d.key] === "true" ? "On" : "Off"}</span>
              </label>
            ) : d.type === "textarea" ? (
              <textarea
                rows={3}
                value={values[d.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm"
              />
            ) : (
              <input
                type={d.type}
                value={values[d.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-white/80 px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={onSave} disabled={busy} className="btn-pgc disabled:opacity-60">
          <Check className="size-4" /> {busy ? "Saving…" : "Save settings"}
        </button>
        {savedAt && <span className="text-xs text-muted-foreground">Last saved: {new Date(savedAt).toLocaleString()}</span>}
      </div>
    </div>
  );
}

// ─── Audit Log Tab ───────────────────────────────────────────────────────────

const AUDIT_TYPES = [
  "generate_ai_feedback", "generate_country_challenge", "approve_country_challenge",
  "edit_country_challenge", "delete_user", "promote_to_admin", "demote_from_admin",
  "edit_theme", "save_settings", "edit_user",
];

function AuditLogTab() {
  type Row = {
    id: string; admin_id: string | null; admin_email: string | null;
    action_type: string; target_type: string | null; target_id: string | null;
    detail: Record<string, string | number | boolean | null> | null; created_at: string;
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = useServerFn(listAuditLog);

  useEffect(() => {
    (async () => {
      try {
        const res = await list({ data: { action_type: filter || undefined, page, pageSize: 50 } });
        setRows(res.rows as Row[]);
        setTotal(res.total);
        setMissing(res.missing);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    })();
  }, [filter, page, list]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="eyebrow">Action type</label>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground ml-auto">{total} total events</p>
      </div>

      {missing ? (
        <p className="text-sm p-4 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
          ⚠ The <code>admin_actions</code> table doesn't exist yet — events will be recorded after the next migration runs.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-border align-top hover:bg-white/30 cursor-pointer"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-3 text-xs">{r.admin_email ?? r.admin_id ?? "—"}</td>
                    <td className="py-3 pr-3"><span className="font-mono text-xs">{r.action_type}</span></td>
                    <td className="py-3 pr-3 text-xs">{r.target_type ? `${r.target_type}:${r.target_id ?? ""}` : "—"}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {r.detail ? (expanded === r.id ? "▾" : "▸") + " click to expand" : "—"}
                    </td>
                  </tr>
                  {expanded === r.id && r.detail && (
                    <tr>
                      <td colSpan={5} className="py-3 pr-3 bg-muted/50">
                        <pre className="text-[11px] overflow-x-auto">{JSON.stringify(r.detail, null, 2)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No events yet.</td></tr>
              )}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-full border border-border disabled:opacity-40">← Prev</button>
            <span>Page {page} of {Math.max(1, Math.ceil(total / 50))}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= total}
              className="px-3 py-1.5 rounded-full border border-border disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CountryChallengesPanel (preserved from prior admin.tsx) ─────────────────

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
  const [milestoneFirst, setMilestoneFirst] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", brief: "", action_prompt: "", success_criteria: "", summary: "" });
  const gen = useServerFn(generateCountryChallenge);
  const approve = useServerFn(approveCountryChallenge);
  const editFn = useServerFn(editCountryChallenge);

  async function reload() {
    const { data } = await supabase
      .from("country_challenges")
      .select("year,country,day_number,theme,status,prompt,summary,title,brief,action_prompt,success_criteria,submission_count,small_sample,approved_at,generated_at")
      .eq("year", YEAR).order("country").order("day_number");
    setRows((data as CCRow[]) ?? []);

    const { data: pool } = await supabase
      .from("submissions").select("country,day_number")
      .eq("phase", "october_research").not("country", "is", null);
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
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  async function approveOne(country: string, day: number) {
    const key = `${country}-${day}`;
    setBusy(key);
    try {
      await approve({ data: { year: YEAR, country, day } });
      toast.success(`Approved — ${country} students can now see Day ${day}`);
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
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
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
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

  const visible = rows.filter((r) =>
    (!fCountry || r.country === fCountry) &&
    (!fDay || r.day_number === Number(fDay)) &&
    (!fStatus || r.status === fStatus),
  );

  const placeholders = fCountry
    ? days.filter((d) => !rows.some((r) => r.country === fCountry && r.day_number === d) && (!fDay || d === Number(fDay)))
        .map((d): CCRow => ({
          country: fCountry, day_number: d, theme: "—", status: "pending",
          prompt: null, summary: null, title: null, brief: null, action_prompt: null,
          success_criteria: null, submission_count: 0, small_sample: false,
          approved_at: null, generated_at: null, year: YEAR,
        }))
    : [];
  const MS = [5, 10, 15, 20, 25, 30];
  const combined = [...placeholders, ...visible];
  const all = milestoneFirst
    ? [...combined].sort((a, b) => (MS.includes(b.day_number) ? 1 : 0) - (MS.includes(a.day_number) ? 1 : 0))
    : combined;

  return (
    <div className="glass-card p-5">
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
          <select value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Day</label>
          <select value={fDay} onChange={(e) => setFDay(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow">Status</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="mt-1 rounded-lg border border-input bg-white/80 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="ready">Ready (awaiting approval)</option>
            <option value="approved">Approved · live</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium pb-2">
          <input type="checkbox" checked={milestoneFirst} onChange={(e) => setMilestoneFirst(e.target.checked)} />
          ★ Milestone days first
        </label>
      </div>


      <div className="mt-4 space-y-3">
        {all.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No country challenges yet.</div>
        )}
        {all.map((r) => {
          const key = `${r.country}-${r.day_number}`;
          const isEditing = editKey === key;
          const isLive = r.status === "approved";
          return (
            <div key={key} className="rounded-xl border border-border bg-white/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-2 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                    {COUNTRIES.includes(r.country) && <img src={getFlagThumb(r.country)} alt="" className="h-3 w-auto rounded-[2px]" />}
                    {r.country} · Day {r.day_number} · {r.theme}
                  </p>
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
                  <input value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.brief} onChange={(e) => setEditDraft((d) => ({ ...d, brief: e.target.value }))} rows={2} placeholder="Brief" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.action_prompt} onChange={(e) => setEditDraft((d) => ({ ...d, action_prompt: e.target.value }))} rows={2} placeholder="Action prompt" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.success_criteria} onChange={(e) => setEditDraft((d) => ({ ...d, success_criteria: e.target.value }))} rows={2} placeholder="Success criteria" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                  <textarea value={editDraft.summary} onChange={(e) => setEditDraft((d) => ({ ...d, summary: e.target.value }))} rows={3} placeholder="Synthesis / summary" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
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

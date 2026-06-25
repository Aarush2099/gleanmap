import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenInput = z.object({
  year: z.number().int().default(2026),
  country: z.string().min(2),
  day: z.number().int().min(1).max(30),
});

const ApproveInput = z.object({
  year: z.number().int().default(2026),
  country: z.string().min(2),
  day: z.number().int().min(1).max(30),
});

const EditInput = z.object({
  year: z.number().int().default(2026),
  country: z.string().min(2),
  day: z.number().int().min(1).max(30),
  title: z.string().optional(),
  brief: z.string().optional(),
  action_prompt: z.string().optional(),
  success_criteria: z.string().optional(),
  summary: z.string().optional(),
});

// Strip emails, urls, @handles, phone numbers, and any obvious PII from a string
function anonymize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/(?<![A-Za-z0-9])@[\w.]+/g, "[handle]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .trim();
}

type Ctx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  claims?: { email?: string } & Record<string, unknown>;
};

async function assertAdmin(context: Ctx) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden: admin only");
  const { data: u } = await context.supabase.auth.getUser();
  if (!u?.user?.email_confirmed_at) {
    throw new Error("Forbidden: verify your email before triggering AI actions");
  }
}

async function logAction(
  _ctx: Ctx,
  _action: string,
  _target: { year: number; country: string; day: number; theme?: string | null },
  _metadata: Record<string, unknown> = {},
) {
  // Audit log table not present in current schema — no-op.
}

export const generateCountryChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // Load theme
    const { data: theme, error: themeErr } = await context.supabase
      .from("program_themes")
      .select("theme,prompt,is_rest_day")
      .eq("year", data.year)
      .eq("day_number", data.day)
      .maybeSingle();
    if (themeErr || !theme) throw new Error("Theme not found");
    if (theme.is_rest_day) throw new Error("Rest day — no challenge");

    // Pull October research from this country/day. We deliberately fetch ONLY
    // the fields needed for synthesis — no user_id, no names, no titles.
    const { data: research } = await context.supabase
      .from("submissions")
      .select("id,location,key_findings,data_sources")
      .eq("phase", "october_research")
      .eq("country", data.country)
      .eq("day_number", data.day)
      .limit(100);

    const submissions = research ?? [];
    const submissionCount = submissions.length;
    const smallSample = submissionCount < 3;
    const sourceIds = submissions.map(r => r.id);

    // Fetch regional context for this country + day (if it exists)
    const { data: regionalCtx } = await context.supabase
      .from("regional_contexts")
      .select("context_headline,context_body,priority")
      .eq("country", data.country)
      .eq("day_number", data.day)
      .eq("year", data.year)
      .maybeSingle();

    // Anonymize every field before it can reach the model
    const anonymizedBlock = submissions.map((r, i) => {
      const loc = anonymize(r.location);
      const findings = anonymize(r.key_findings);
      const sources = anonymize(r.data_sources);
      return `Submission ${i + 1}\nLocation: ${loc || "(not provided)"}\nFindings: ${findings || "(none)"}\nData sources: ${sources || "(none)"}`;
    }).join("\n\n").slice(0, 12000);


    // Mark generating
    await context.supabase.from("country_challenges").upsert({
      year: data.year, country: data.country, day_number: data.day,
      theme: theme.theme, status: "generating",
      submission_count: submissionCount, small_sample: smallSample,
    }, { onConflict: "year,country,day_number" });

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const { createLovableAiGateway } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGateway(apiKey);

    const regionalSection = regionalCtx
      ? `\n\nRegional priority context for ${data.country} on this theme:\n"${regionalCtx.context_headline}: ${regionalCtx.context_body}"\nPriority level: ${regionalCtx.priority}. Factor this local context into the November challenge — the action prompt should address this specific local reality.`
      : "";

    const system = `You are analyzing a group of Regional Audit submissions from students in the same country, all responding to the same Project Green Challenge research theme. You'll receive the theme name, the country, and the combined, anonymized findings from every audit submitted for that theme in that country — no names attached. Return JSON with: 'summary' (2-4 sentences synthesizing the common patterns or local realities across these submissions — do not quote or closely paraphrase any single submission), and 'november_challenge' (an object with title, brief describing the shared local issue this country's students surfaced, action_prompt — one concrete, achievable action students in this country can take this week to address it, and success_criteria). Write for a teen/young-adult audience, encouraging tone. If fewer than 3 submissions were provided, still produce a thoughtful synthesis but say so explicitly in 'summary' and keep the synthesis general enough that no individual submission could be reverse-identified from the wording. Output only the JSON.${regionalSection}`;

    const userPrompt = `Theme: ${theme.theme}
Country: ${data.country}
Submission count: ${submissionCount}${smallSample ? " (SMALL SAMPLE — fewer than 3)" : ""}
October research prompt: ${theme.prompt ?? "(none)"}

Anonymized submissions from ${data.country}:
${anonymizedBlock || "(no submissions for this country/theme)"}`;

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt: userPrompt,
        experimental_output: Output.object({
          schema: z.object({
            summary: z.string(),
            november_challenge: z.object({
              title: z.string(),
              brief: z.string(),
              action_prompt: z.string(),
              success_criteria: z.string(),
            }),
          }),
        }),
      });
      const out = (result as unknown as {
        experimental_output: {
          summary: string;
          november_challenge: { title: string; brief: string; action_prompt: string; success_criteria: string };
        };
      }).experimental_output;

      const { error: updErr } = await context.supabase
        .from("country_challenges")
        .update({
          status: "ready",
          summary: out.summary,
          title: out.november_challenge.title,
          brief: out.november_challenge.brief,
          action_prompt: out.november_challenge.action_prompt,
          success_criteria: out.november_challenge.success_criteria,
          prompt: out.november_challenge.action_prompt, // backwards compat
          source_research_ids: sourceIds,
          submission_count: submissionCount,
          small_sample: smallSample,
          generated_at: new Date().toISOString(),
          approved_at: null,
        })
        .eq("year", data.year).eq("country", data.country).eq("day_number", data.day);
      if (updErr) throw updErr;

      await logAction(context, "generate", { ...data, theme: theme.theme }, {
        submission_count: submissionCount, small_sample: smallSample,
      });

      return { ok: true, small_sample: smallSample, submission_count: submissionCount, ...out };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("country_challenges").update({ status: "failed" })
        .eq("year", data.year).eq("country", data.country).eq("day_number", data.day);
      await logAction(context, "generate_failed", { ...data, theme: theme.theme }, { error: msg });
      if (msg.includes("429")) throw new Error("AI rate-limited. Try again shortly.");
      if (msg.includes("402")) throw new Error("AI credits exhausted.");
      throw new Error(`AI generation failed: ${msg}`);
    }
  });

export const approveCountryChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: row } = await context.supabase
      .from("country_challenges")
      .select("status,theme,action_prompt")
      .eq("year", data.year).eq("country", data.country).eq("day_number", data.day)
      .maybeSingle();
    if (!row) throw new Error("Challenge not found");
    if (!row.action_prompt) throw new Error("Cannot approve an empty challenge — generate it first");

    const { error } = await context.supabase
      .from("country_challenges")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("year", data.year).eq("country", data.country).eq("day_number", data.day);
    if (error) throw error;

    await logAction(context, "approve", { ...data, theme: row.theme });
    return { ok: true };
  });

export const editCountryChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.brief !== undefined) patch.brief = data.brief;
    if (data.action_prompt !== undefined) { patch.action_prompt = data.action_prompt; patch.prompt = data.action_prompt; }
    if (data.success_criteria !== undefined) patch.success_criteria = data.success_criteria;
    if (data.summary !== undefined) patch.summary = data.summary;
    // Editing invalidates approval — admin must re-approve to publish to students
    patch.status = "ready";
    patch.approved_at = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from("country_challenges")
      .update(patch)
      .eq("year", data.year).eq("country", data.country).eq("day_number", data.day)
      .select("theme")
      .maybeSingle();
    if (error) throw error;

    await logAction(context, "edit", { ...data, theme: row?.theme }, { fields: Object.keys(patch) });
    return { ok: true };
  });

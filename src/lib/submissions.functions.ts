import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({ submissionId: z.string().uuid() });

export const generateAiFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Authorize: must be admin
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin only");

    // Require verified email for any privileged AI trigger
    const { data: userData } = await context.supabase.auth.getUser();
    if (!userData?.user?.email_confirmed_at) {
      throw new Error("Forbidden: verify your email before triggering AI actions");
    }

    const { data: sub, error } = await context.supabase
      .from("submissions")
      .select("id,phase,theme,type,title,description,country,day_number")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (error || !sub) throw new Error("Submission not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { createLovableAiGateway } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGateway(apiKey);

    const prompt = `You are reviewing a student climate-action submission for Project Green Challenge (PGC).
Country: ${sub.country ?? "unknown"}
Phase: ${sub.phase}
Type: ${sub.type}
Theme: ${sub.theme}
Title: ${sub.title}
Description: ${sub.description ?? "(none)"}

Provide:
1. "feedback": a 2-4 sentence evaluation of quality, depth, and relevance to the student's region.
2. "next_steps": a 2-4 sentence actionable suggestion personalized to their country and theme.
Return strict JSON.`;

    async function audit(_action: string, _metadata: Record<string, unknown>) {
      // Audit log table not present in current schema — no-op.
    }

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        experimental_output: Output.object({
          schema: z.object({ feedback: z.string(), next_steps: z.string() }),
        }),
      });
      const out = (result as unknown as { experimental_output: { feedback: string; next_steps: string } }).experimental_output;

      const { error: updErr } = await context.supabase
        .from("submissions")
        .update({
          ai_feedback: out.feedback,
          ai_next_steps: out.next_steps,
          status: "reviewed",
        })
        .eq("id", data.submissionId);
      if (updErr) throw updErr;

      await audit("ai_feedback_generate", {});
      return { ok: true, feedback: out.feedback, next_steps: out.next_steps };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await audit("ai_feedback_failed", { error: msg });
      if (msg.includes("429")) throw new Error("AI rate-limited. Try again shortly.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits in Lovable Cloud.");
      throw new Error(`AI generation failed: ${msg}`);
    }
  });

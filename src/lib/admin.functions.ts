import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ctx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  claims?: { email?: string } & Record<string, unknown>;
};

async function assertAdmin(context: Ctx) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden: admin only");
}

// Best-effort audit log write. Silently no-ops if the admin_actions table
// doesn't exist yet (i.e. before the audit-log migration runs).
async function tryLog(
  ctx: Ctx,
  action_type: string,
  target: { type?: string; id?: string } = {},
  detail: Record<string, unknown> = {},
) {
  try {
    const adminEmail = (ctx.claims?.email as string | undefined) ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.supabase as any).from("admin_actions").insert({
      admin_id: ctx.userId,
      admin_email: adminEmail,
      action_type,
      target_type: target.type ?? null,
      target_id: target.id ?? null,
      detail,
    });
  } catch {
    /* table may not exist yet — ignore */
  }
}


// ── Users ────────────────────────────────────────────────────────────────────

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own admin account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascade-delete profile (FKs handle submissions/achievements)
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    // Then remove auth user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).auth.admin.deleteUser(data.userId);
    if (error) throw error;
    await tryLog(context, "delete_user", { type: "user", id: data.userId });
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["student", "admin"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.role === "admin") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      await tryLog(context, "promote_to_admin", { type: "user", id: data.userId });
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      await tryLog(context, "demote_from_admin", { type: "user", id: data.userId });
    }
    return { ok: true };
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      full_name: z.string().trim().min(1).max(120),
      country: z.string().trim().min(1).max(80),
      school: z.string().trim().min(1).max(160),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, country: data.country, school: data.school })
      .eq("id", data.userId);
    if (error) throw error;
    await tryLog(context, "edit_user", { type: "user", id: data.userId }, {
      full_name: data.full_name, country: data.country, school: data.school,
    });
    return { ok: true };
  });

// ── Themes ───────────────────────────────────────────────────────────────────

export const upsertTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      year: z.number().int(),
      day_number: z.number().int().min(1).max(60),
      theme: z.string().min(1).max(80),
      prompt: z.string().min(1).max(4000),
      is_rest_day: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("program_themes")
      .upsert(data, { onConflict: "year,day_number" });
    if (error) throw error;
    await tryLog(context, "edit_theme", { type: "theme", id: `${data.year}-${data.day_number}` }, {
      theme: data.theme, is_rest_day: data.is_rest_day,
    });
    return { ok: true };
  });

// ── Site Settings ────────────────────────────────────────────────────────────

export const listAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (context.supabase as any)
        .from("admin_settings")
        .select("key,value,updated_at");
      if (error) return { settings: [], missing: true };
      return { settings: (data ?? []) as { key: string; value: string; updated_at: string }[], missing: false };
    } catch {
      return { settings: [], missing: true };
    }
  });


export const saveAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entries: z.array(z.object({ key: z.string().min(1), value: z.string() })) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const rows = data.entries.map((e) => ({ ...e, updated_at: now }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from("admin_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;

    await tryLog(context, "save_settings", {}, { keys: data.entries.map((e) => e.key) });
    return { ok: true, saved_at: now };
  });

// Public read for non-admins: returns key/value list of "public" settings only.
export const getPublicSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb as any).from("admin_settings").select("key,value");

      return { settings: data ?? [] };
    } catch {
      return { settings: [] };
    }
  });

// ── Audit log ────────────────────────────────────────────────────────────────

export type AuditRow = {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, string | number | boolean | null> | null;
  created_at: string;
};


export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      action_type: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(200).default(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (context.supabase as any)
        .from("admin_actions")
        .select("id,admin_id,admin_email,action_type,target_type,target_id,detail,created_at", { count: "exact" })
        .order("created_at", { ascending: false });
      if (data.action_type) q = q.eq("action_type", data.action_type);
      const from = (data.page - 1) * data.pageSize;
      const to = from + data.pageSize - 1;
      const { data: rows, count, error } = await q.range(from, to);
      if (error) return { rows: [] as AuditRow[], total: 0, missing: true };
      return { rows: (rows ?? []) as AuditRow[], total: count ?? 0, missing: false };
    } catch {
      return { rows: [] as AuditRow[], total: 0, missing: true };

    }
  });

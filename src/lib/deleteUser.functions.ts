import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DeleteInput = z.object({ userId: z.string().uuid() });

export const deleteUserById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId: callerId } = context;

    // 1. Verify the caller is an admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    // 2. Prevent self-deletion
    if (data.userId === callerId) {
      throw new Error("Cannot delete your own account");
    }

    // 3. Best-effort: delete uploaded files from storage
    const { data: userSubmissions } = await supabase
      .from("submissions")
      .select("attachment_paths")
      .eq("user_id", data.userId);

    if (userSubmissions) {
      const allPaths = userSubmissions
        .flatMap((s: { attachment_paths: string[] | null }) => s.attachment_paths ?? [])
        .filter(Boolean);
      if (allPaths.length > 0) {
        await supabase.storage.from("submissions").remove(allPaths);
      }
    }

    // 4. Delete profile row (FK cascades remove submissions, achievements, etc.)
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", data.userId);

    if (profileDeleteError) throw new Error(profileDeleteError.message);

    // 5. Best-effort: remove auth user. May require service role; treat
    //    failure as non-fatal since the profile is already gone.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: authDeleteError } = await (supabase as any).auth.admin.deleteUser(
        data.userId,
      );
      if (authDeleteError && !authDeleteError.message.includes("not found")) {
        console.warn("Auth user delete warning:", authDeleteError.message);
      }
    } catch (e) {
      console.warn("Auth admin delete unavailable:", e instanceof Error ? e.message : e);
    }

    return { success: true, deletedUserId: data.userId };
  });

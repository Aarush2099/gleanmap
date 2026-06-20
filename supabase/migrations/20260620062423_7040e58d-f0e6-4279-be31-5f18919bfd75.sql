
-- Set immutable search_path on touch_updated_at (was missing)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke EXECUTE from anon/authenticated on definer functions that should
-- only run inside triggers or via service_role. has_role stays open
-- because RLS policies invoke it as the current user.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_allowlist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_submission_country()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at()        FROM PUBLIC, anon, authenticated;

-- Tighten program_themes to signed-in users only (was readable by anon)
DROP POLICY IF EXISTS "themes readable by everyone" ON public.program_themes;
CREATE POLICY "themes readable by signed-in users"
  ON public.program_themes FOR SELECT TO authenticated USING (true);

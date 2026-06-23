
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, country, school, participant_number) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles read own or admin" ON public.profiles;
DROP POLICY IF EXISTS profiles_own_row ON public.profiles;
CREATE POLICY profiles_own_row ON public.profiles
  FOR ALL TO authenticated
  USING ((id = auth.uid()) OR public.has_role('admin'::app_role))
  WITH CHECK ((id = auth.uid()) OR public.has_role('admin'::app_role));

CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE verified_email text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN NEW.role := OLD.role; END IF;
    SELECT email INTO verified_email FROM auth.users WHERE id = OLD.id;
    NEW.email := COALESCE(verified_email, OLD.email);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS prevent_profile_sensitive_update_trg ON public.profiles;
CREATE TRIGGER prevent_profile_sensitive_update_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_sensitive_update();

DROP POLICY IF EXISTS "Users can delete their tree images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their tree images" ON storage.objects;
DROP POLICY IF EXISTS "Tree images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "tree-images public read" ON storage.objects;

CREATE POLICY "subs storage update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'submissions' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'submissions' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "subs storage delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'submissions' AND (auth.uid())::text = (storage.foldername(name))[1]);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.individual_leaderboard(integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.country_leaderboard() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_rank(uuid) FROM anon, public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM authenticated;

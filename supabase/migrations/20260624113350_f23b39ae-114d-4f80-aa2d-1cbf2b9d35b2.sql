
DROP POLICY IF EXISTS "Users can upload tree images" ON storage.objects;
DROP POLICY IF EXISTS "tree-images owner insert" ON storage.objects;
DROP POLICY IF EXISTS "tree-images owner read" ON storage.objects;

CREATE POLICY "tree-images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "tree-images owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

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

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, country, school, participant_number) ON public.profiles TO authenticated;

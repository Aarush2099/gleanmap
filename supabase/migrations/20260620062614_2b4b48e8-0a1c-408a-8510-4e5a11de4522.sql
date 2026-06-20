
-- Make the admin allowlist trigger fire on UPDATE as well as INSERT
DROP TRIGGER IF EXISTS profiles_enforce_admin_allowlist ON public.profiles;
CREATE TRIGGER profiles_enforce_admin_allowlist
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_allowlist();

-- Storage: deny overwrites/moves outside the user's own folder
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
CREATE POLICY "Users update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

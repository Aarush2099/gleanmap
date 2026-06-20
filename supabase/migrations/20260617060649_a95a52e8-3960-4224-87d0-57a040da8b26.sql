
-- Revoke public execute from trigger-only fns (silences linter; triggers still run as table owner)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_allowlist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_submission_country() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role must be callable from policies/queries by authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Storage policies: users can upload/read/delete files only in their own folder under submissions/
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'submissions' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

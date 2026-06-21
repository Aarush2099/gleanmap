
DROP POLICY IF EXISTS "subs storage read own" ON storage.objects;
DROP POLICY IF EXISTS "subs storage upload own" ON storage.objects;
DROP POLICY IF EXISTS "subs storage admin read" ON storage.objects;

CREATE POLICY "subs storage read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "subs storage upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "subs storage admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'admin'));

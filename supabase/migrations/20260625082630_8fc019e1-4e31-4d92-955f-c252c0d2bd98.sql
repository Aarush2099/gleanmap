
-- Defense-in-depth: prevent privilege escalation via direct UPDATE of profiles.role / profiles.email.
-- The prevent_profile_sensitive_update trigger already reverts such changes, but we also
-- restrict column-level UPDATE privileges so the RLS engine itself blocks writes to these columns.

REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (full_name, country, school, participant_number) ON public.profiles TO authenticated;

-- Keep service_role unrestricted (admin server fns)
GRANT ALL ON public.profiles TO service_role;

-- Tighten the own-row policy so SELECT/INSERT/UPDATE/DELETE are explicit and role/email cannot be self-set.
DROP POLICY IF EXISTS profiles_own_row ON public.profiles;

CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY profiles_update_self_safe ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role('admin'::app_role))
  WITH CHECK (id = auth.uid() OR public.has_role('admin'::app_role));

CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role('admin'::app_role));


-- admin_settings: global site configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_admin_all" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_all" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous + authenticated to read a small allowlist of public settings
DROP POLICY IF EXISTS "admin_settings_public_read" ON public.admin_settings;
CREATE POLICY "admin_settings_public_read" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('registration_open', 'maintenance_mode', 'welcome_message', 'program_year'));

-- admin_actions: audit log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email text,
  action_type text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_action_type_idx ON public.admin_actions (action_type);

GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_actions_admin_select" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_select" ON public.admin_actions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin_actions_admin_insert" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_insert" ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

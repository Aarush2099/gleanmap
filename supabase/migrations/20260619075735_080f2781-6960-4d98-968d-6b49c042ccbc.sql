
ALTER TABLE public.country_challenges
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS brief TEXT,
  ADD COLUMN IF NOT EXISTS action_prompt TEXT,
  ADD COLUMN IF NOT EXISTS success_criteria TEXT,
  ADD COLUMN IF NOT EXISTS submission_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS small_sample BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "users read their own country challenges" ON public.country_challenges;
CREATE POLICY "users read approved country challenges"
  ON public.country_challenges FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      status = 'approved'::public.country_challenge_status
      AND country = (SELECT country FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_country TEXT,
  target_day_number INTEGER,
  target_theme TEXT,
  target_year INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read admin actions"
  ON public.admin_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON public.admin_actions (target_country, target_day_number);

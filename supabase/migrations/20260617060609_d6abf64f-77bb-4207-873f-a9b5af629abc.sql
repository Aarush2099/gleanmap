
-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.submission_phase AS ENUM ('october_research', 'november_action');
CREATE TYPE public.submission_type AS ENUM ('regional_audit', 'policy_change');
CREATE TYPE public.submission_status AS ENUM ('submitted', 'reviewed');

-- =========== ADMIN ALLOWLIST ===========
CREATE TABLE public.admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- No policies on admin_emails: only service_role can read/write. Promotion happens via trigger.

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'student',
  country TEXT,
  school TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- has_role helper (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;

-- Profile policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Block clients from setting role to admin unless email is in admin_emails
CREATE OR REPLACE FUNCTION public.enforce_admin_allowlist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
      NEW.role := 'student';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_enforce_admin_allowlist
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_allowlist();

-- Auto-create profile on new auth user; auto-promote if email is in allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) INTO is_admin;
  INSERT INTO public.profiles (id, email, full_name, role, country)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN is_admin THEN 'admin'::public.app_role ELSE 'student'::public.app_role END,
    NEW.raw_user_meta_data->>'country'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========== SUBMISSIONS ===========
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country TEXT,
  phase public.submission_phase NOT NULL,
  day_number INT,
  theme TEXT NOT NULL,
  type public.submission_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  status public.submission_status NOT NULL DEFAULT 'submitted',
  ai_feedback TEXT,
  ai_next_steps TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX submissions_user_idx ON public.submissions(user_id);
CREATE INDEX submissions_country_idx ON public.submissions(country);
CREATE INDEX submissions_phase_idx ON public.submissions(phase);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Denormalize country from profile on insert
CREATE OR REPLACE FUNCTION public.set_submission_country()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.country IS NULL THEN
    SELECT country INTO NEW.country FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER submissions_set_country
  BEFORE INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_submission_country();

CREATE POLICY "Students read own submissions, admins read all" ON public.submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students insert own submissions" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students update own submissions" ON public.submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update any submission" ON public.submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students delete own submissions" ON public.submissions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========== SUBMISSION LINKS (policy -> research) ===========
CREATE TABLE public.submission_links (
  policy_submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  research_submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (policy_submission_id, research_submission_id)
);
GRANT SELECT, INSERT, DELETE ON public.submission_links TO authenticated;
GRANT ALL ON public.submission_links TO service_role;
ALTER TABLE public.submission_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads links" ON public.submission_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.submissions s
            WHERE s.id = policy_submission_id AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Owner inserts links" ON public.submission_links
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = policy_submission_id AND s.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = research_submission_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Owner deletes links" ON public.submission_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = policy_submission_id AND s.user_id = auth.uid())
  );

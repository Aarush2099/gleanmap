
-- 1) Drop GleanMap tables & related objects
DROP TABLE IF EXISTS public.tree_visits CASCADE;
DROP TABLE IF EXISTS public.tree_likes CASCADE;
DROP TABLE IF EXISTS public.tree_comments CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.trees CASCADE;
DROP TABLE IF EXISTS public.fruit_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2) Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 3) Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  country text,
  school text,
  participant_number text UNIQUE NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  points integer NOT NULL DEFAULT 0,
  first_submission_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_set_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'country'
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'aarushmahajan2008@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any pre-existing auth users
INSERT INTO public.profiles (id, email, full_name, country)
SELECT u.id, u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)),
  u.raw_user_meta_data->>'country'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Grant admin to that email if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'aarushmahajan2008@gmail.com'
ON CONFLICT DO NOTHING;

-- 5) program_themes
CREATE TABLE public.program_themes (
  year integer NOT NULL,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  theme text NOT NULL,
  prompt text,
  is_rest_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, day_number)
);
GRANT SELECT ON public.program_themes TO anon, authenticated;
GRANT ALL ON public.program_themes TO service_role;
ALTER TABLE public.program_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes public read" ON public.program_themes FOR SELECT USING (true);

INSERT INTO public.program_themes (year, day_number, theme, prompt, is_rest_day) VALUES
(2026,1,'Why','Why do you care about climate? Map the local conditions that brought you here.',false),
(2026,2,'Footprint','Measure and document your household or campus carbon footprint.',false),
(2026,3,'Cities','How is your city designed for (or against) sustainability?',false),
(2026,4,'Food','Audit a meal or local food system from farm to plate.',false),
(2026,5,'Water','Trace your local watershed and water access realities.',false),
(2026,6,'Fashion','Investigate the lifecycle of one garment in your closet.',false),
(2026,7,'Waste','Conduct a 24-hour personal or household waste audit.',false),
(2026,8,'Oceans','Document ocean / waterway health where you live.',false),
(2026,9,'Climate Justice','Map a frontline community in your region and the policies that shape them.',false),
(2026,10,'Holiday',NULL,true),
(2026,11,'Forests','Inventory tree cover, species, or deforestation pressure near you.',false),
(2026,12,'Outdoors','Document access (or lack of it) to green space in your community.',false),
(2026,13,'Indigenous Peoples','Whose land are you on? Document the Indigenous nations and their ongoing stewardship.',false),
(2026,14,'Body','Audit personal care or food products for hidden environmental costs.',false),
(2026,15,'Soil','Investigate soil health, regenerative agriculture, or urban gardens nearby.',false),
(2026,16,'Holiday',NULL,true),
(2026,17,'Food Waste','Measure food waste in one household, dorm, or cafeteria.',false),
(2026,18,'Wellness','Map the intersection of environmental health and community wellness.',false),
(2026,19,'Connect','Interview a local climate leader, farmer, or organizer.',false),
(2026,20,'Plant-Based','Try and document a fully plant-based day; analyze the impact.',false),
(2026,21,'Fair Trade','Trace one product you bought back to its labor and supply chain.',false),
(2026,22,'Nature','Spend time outside and document a single ecosystem in detail.',false),
(2026,23,'Purpose','Define your why — write a personal climate purpose statement.',false),
(2026,24,'Energy','Audit energy use and sources for your home, school, or city.',false),
(2026,25,'Advocate','Document an advocacy or policy moment happening in your region.',false),
(2026,26,'Holiday',NULL,true),
(2026,27,'Commitment','Identify one commitment you''re ready to make and the systems behind it.',false),
(2026,28,'Activate','Plan a local action and identify the stakeholders involved.',false),
(2026,29,'Reflect','Reflect on the month: what surprised you, what changed?',false),
(2026,30,'Inspire','Document a story, person, or place that inspires your climate work.',false);

-- 6) submissions
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country text,
  phase text NOT NULL CHECK (phase IN ('october_research','november_action')),
  day_number integer CHECK (day_number BETWEEN 1 AND 30),
  theme text NOT NULL,
  type text NOT NULL DEFAULT 'regional_audit',
  title text NOT NULL,
  description text,
  location text,
  key_findings text,
  data_sources text,
  source_links text[],
  attachment_paths text[],
  media_url text,
  ai_feedback text,
  ai_next_steps text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_user_idx ON public.submissions(user_id);
CREATE INDEX submissions_country_day_idx ON public.submissions(country, day_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subs read admin" ON public.submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "subs insert own" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs update own" ON public.submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subs update admin" ON public.submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "subs delete own" ON public.submissions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER submissions_set_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_submission_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta integer := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := CASE NEW.phase WHEN 'october_research' THEN 100 WHEN 'november_action' THEN 50 ELSE 0 END;
    UPDATE public.profiles
      SET points = points + delta,
          first_submission_at = COALESCE(first_submission_at, NEW.submitted_at)
      WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'reviewed' AND COALESCE(OLD.status,'') <> 'reviewed' THEN
      UPDATE public.profiles SET points = points + 25 WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER submissions_points_ins AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.apply_submission_points();
CREATE TRIGGER submissions_points_upd AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.apply_submission_points();

-- 7) country_challenges
CREATE TABLE public.country_challenges (
  year integer NOT NULL,
  country text NOT NULL,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  theme text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','ready','failed','approved')),
  prompt text,
  summary text,
  title text,
  brief text,
  action_prompt text,
  success_criteria text,
  source_research_ids uuid[],
  submission_count integer DEFAULT 0,
  small_sample boolean DEFAULT false,
  generated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, country, day_number)
);
GRANT SELECT ON public.country_challenges TO authenticated;
GRANT ALL ON public.country_challenges TO service_role;
ALTER TABLE public.country_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc read approved" ON public.country_challenges FOR SELECT TO authenticated USING (status = 'approved');
CREATE POLICY "cc read admin" ON public.country_challenges FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cc admin write" ON public.country_challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cc_set_updated BEFORE UPDATE ON public.country_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) achievements
CREATE TABLE public.achievements (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach public read" ON public.achievements FOR SELECT USING (true);

INSERT INTO public.achievements (code,name,description,icon,sort_order) VALUES
('first_audit','First Audit','Submitted your first regional audit.','sparkles',1),
('field_researcher','Field Researcher','Submitted 5 regional audits.','microscope',2),
('streak_keeper','Streak Keeper','Submitted on 5 consecutive days.','flame',3),
('october_complete','October Complete','Submitted on all 27 research days.','calendar-check',4),
('changemaker','Changemaker','Submitted a November policy-change action.','megaphone',5),
('top_10','Top 10','Reached the top 10 on the global leaderboard.','trophy',6),
('trailblazer','Trailblazer','First in your country to submit.','flag',7);

CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);
GRANT SELECT ON public.user_achievements TO anon, authenticated;
GRANT INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua public read" ON public.user_achievements FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.maybe_unlock_achievements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  research_count int;
  action_count int;
  distinct_days int;
  is_first_in_country boolean;
BEGIN
  SELECT count(*) INTO research_count FROM public.submissions
    WHERE user_id = NEW.user_id AND phase = 'october_research';
  SELECT count(*) INTO action_count FROM public.submissions
    WHERE user_id = NEW.user_id AND phase = 'november_action';
  SELECT count(DISTINCT day_number) INTO distinct_days FROM public.submissions
    WHERE user_id = NEW.user_id AND phase = 'october_research';

  IF research_count >= 1 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'first_audit') ON CONFLICT DO NOTHING;
  END IF;
  IF research_count >= 5 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'field_researcher') ON CONFLICT DO NOTHING;
  END IF;
  IF distinct_days >= 27 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'october_complete') ON CONFLICT DO NOTHING;
  END IF;
  IF action_count >= 1 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'changemaker') ON CONFLICT DO NOTHING;
  END IF;

  -- Streak Keeper: any 5 consecutive distinct submission days
  IF (
    SELECT bool_or(consecutive_count >= 5) FROM (
      SELECT count(*) AS consecutive_count
      FROM (
        SELECT d, d - (row_number() OVER (ORDER BY d))::int * interval '1 day' AS grp
        FROM (
          SELECT DISTINCT submitted_at::date AS d FROM public.submissions
          WHERE user_id = NEW.user_id AND phase = 'october_research'
        ) s
      ) g
      GROUP BY grp
    ) c
  ) THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'streak_keeper') ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.country IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.submissions
      WHERE country = NEW.country AND id <> NEW.id
    ) INTO is_first_in_country;
    IF is_first_in_country THEN
      INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'trailblazer') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER submissions_ach_ins AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.maybe_unlock_achievements();

-- 9) Leaderboard RPCs
CREATE OR REPLACE FUNCTION public.individual_leaderboard(_limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS TABLE(rank bigint, id uuid, full_name text, country text, points int, participant_number text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY p.points DESC, COALESCE(p.first_submission_at, now() + interval '100 years') ASC, p.created_at ASC) AS rank,
         p.id, p.full_name, p.country, p.points, p.participant_number
  FROM public.profiles p
  ORDER BY p.points DESC, COALESCE(p.first_submission_at, now() + interval '100 years') ASC, p.created_at ASC
  LIMIT _limit OFFSET _offset
$$;

CREATE OR REPLACE FUNCTION public.user_rank(_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rnk FROM (
    SELECT id, row_number() OVER (ORDER BY points DESC, COALESCE(first_submission_at, now() + interval '100 years') ASC, created_at ASC) AS rnk
    FROM public.profiles
  ) r WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.country_leaderboard()
RETURNS TABLE(rank bigint, country text, total_points bigint, participants bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY sum(points) DESC) AS rank,
         country, sum(points)::bigint AS total_points, count(*)::bigint AS participants
  FROM public.profiles WHERE country IS NOT NULL AND country <> ''
  GROUP BY country
  ORDER BY total_points DESC
$$;

GRANT EXECUTE ON FUNCTION public.individual_leaderboard(int,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_rank(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.country_leaderboard() TO anon, authenticated;

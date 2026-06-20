
-- 1. program_themes
CREATE TABLE public.program_themes (
  year int NOT NULL DEFAULT 2026,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  theme text NOT NULL,
  prompt text,
  is_rest_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, day_number)
);

GRANT SELECT ON public.program_themes TO anon, authenticated;
GRANT ALL ON public.program_themes TO service_role;

ALTER TABLE public.program_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes readable by everyone"
  ON public.program_themes FOR SELECT
  USING (true);

-- Seed 2026
INSERT INTO public.program_themes (year, day_number, theme, prompt, is_rest_day) VALUES
(2026, 1,  'Why',              'Why are you here? What world do you want to help create?', false),
(2026, 2,  'Footprint',        'How big is your ecological footprint where you live — and what drives it?', false),
(2026, 3,  'Cities',           'How does your city or town shape the way people live with nature?', false),
(2026, 4,  'Food',             'Where does the food in your region actually come from?', false),
(2026, 5,  'Water',            'Where does your water come from, and who or what is competing for it?', false),
(2026, 6,  'Fashion',          'Trace one piece of clothing you own back to its origin.', false),
(2026, 7,  'Waste',            'What happens to waste once it leaves your home in your region?', false),
(2026, 8,  'Oceans',           'How is the nearest body of water to you doing — and why?', false),
(2026, 9,  'Climate Justice',  'Who in your region is most exposed to climate harm, and why?', false),
(2026, 10, 'Holiday',          NULL, true),
(2026, 11, 'Forests',          'What is the state of forests and trees in your region?', false),
(2026, 12, 'Outdoors',         'Who has access to nature and green space where you live — and who does not?', false),
(2026, 13, 'Indigenous Peoples','Whose ancestral land are you on, and what are local Indigenous-led efforts?', false),
(2026, 14, 'Body',             'What is in the personal-care and household products sold in your region?', false),
(2026, 15, 'Soil',             'How healthy is the soil and farmland near you?', false),
(2026, 16, 'Holiday',          NULL, true),
(2026, 17, 'Food Waste',       'How much food is wasted in your community, and where does it go?', false),
(2026, 18, 'Wellness',         'How do environment and health intersect in your region?', false),
(2026, 19, 'Connect',          'Who in your region is already organizing for climate or environment?', false),
(2026, 20, 'Plant-Based',      'How accessible and affordable is plant-based food where you live?', false),
(2026, 21, 'Fair Trade',       'How are workers in your region''s supply chains being treated?', false),
(2026, 22, 'Nature',           'What native species and ecosystems are at risk near you?', false),
(2026, 23, 'Purpose',          'What environmental issue in your region do you feel called to work on?', false),
(2026, 24, 'Energy',           'Where does your region''s electricity come from?', false),
(2026, 25, 'Advocate',         'What environmental policies are currently being debated in your region?', false),
(2026, 26, 'Holiday',          NULL, true),
(2026, 27, 'Commitment',       'What is one ongoing commitment you can document in your region?', false),
(2026, 28, 'Activate',         'Who is mobilizing action in your region, and how?', false),
(2026, 29, 'Reflect',          'Looking across the month, what pattern do you see in your region?', false),
(2026, 30, 'Inspire',          'Tell the story of one person or project in your region that inspires you.', false);

-- 2. country_challenges
DO $$ BEGIN
  CREATE TYPE public.country_challenge_status AS ENUM ('pending','generating','ready','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.country_challenges (
  year int NOT NULL DEFAULT 2026,
  country text NOT NULL,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  theme text NOT NULL,
  status public.country_challenge_status NOT NULL DEFAULT 'pending',
  prompt text,
  summary text,
  source_research_ids uuid[] NOT NULL DEFAULT '{}',
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, country, day_number)
);
CREATE INDEX country_challenges_country_day_idx ON public.country_challenges (year, country, day_number);

GRANT SELECT ON public.country_challenges TO authenticated;
GRANT ALL ON public.country_challenges TO service_role;

ALTER TABLE public.country_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read their own country challenges"
  ON public.country_challenges FOR SELECT
  TO authenticated
  USING (
    country = (SELECT country FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "admins insert country challenges"
  ON public.country_challenges FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update country challenges"
  ON public.country_challenges FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER country_challenges_touch
  BEFORE UPDATE ON public.country_challenges
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. additive columns on submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS key_findings text,
  ADD COLUMN IF NOT EXISTS data_sources text,
  ADD COLUMN IF NOT EXISTS source_links text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attachment_paths text[] NOT NULL DEFAULT '{}';

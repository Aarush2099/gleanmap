
-- 1. Rewrite has_role to query user_roles (not user-editable profiles.role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role) $$;

-- 2. Block self-mutation of role/email on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN NEW.role := OLD.role; END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN NEW.email := OLD.email; END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_block_sensitive_update ON public.profiles;
CREATE TRIGGER profiles_block_sensitive_update
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_sensitive_update();

-- 3. Restrict profiles SELECT (no anon, owner+admin only)
REVOKE SELECT ON public.profiles FROM anon;
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
DROP POLICY IF EXISTS "profiles read own or admin" ON public.profiles;
CREATE POLICY "profiles read own or admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 4. Restrict user_achievements reads
REVOKE SELECT ON public.user_achievements FROM anon;
DROP POLICY IF EXISTS "ua public read" ON public.user_achievements;
DROP POLICY IF EXISTS "ua read own or admin" ON public.user_achievements;
CREATE POLICY "ua read own or admin" ON public.user_achievements
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. tree-images storage: ownership-scoped UPDATE/DELETE, drop listing
DO $$ BEGIN
  -- drop any existing overly-permissive policies for this bucket
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON storage.objects;', polname), ' ')
    FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND (qual LIKE '%tree-images%' OR with_check LIKE '%tree-images%')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "tree-images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "tree-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "tree-images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='tree-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "tree-images public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id='tree-images');

-- 6. Remove submissions + user_achievements from realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.submissions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.user_achievements;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.maybe_unlock_achievements() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_on_allowlist() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_submission_points() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_sensitive_update() FROM anon, authenticated;

-- 8. Seed admin allowlist + ensure role grant if already signed up
INSERT INTO public.admin_emails(email) VALUES ('aarushmahajan2008@gmail.com')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles(user_id, role)
  SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'aarushmahajan2008@gmail.com'
  ON CONFLICT DO NOTHING;

UPDATE public.profiles SET role='admin'
  WHERE email='aarushmahajan2008@gmail.com';

-- 9. Seed PGC 2026 30-day theme calendar
INSERT INTO public.program_themes(year, day_number, theme, is_rest_day, prompt) VALUES
(2026,1,'Why',false,'Document your personal why for joining PGC. What local environmental or social issue motivates you most? Collect 1 photo, 1 data point, and 1 quote from someone in your community.'),
(2026,2,'Footprint',false,'Use a carbon footprint calculator to estimate your annual emissions. Document 3 key findings about your footprint in your country''s context.'),
(2026,3,'Cities',false,'Research your city''s climate action plan. Document green infrastructure, public transit, and urban heat island data for your area.'),
(2026,4,'Food',false,'Map where your food comes from. Research local food insecurity, agricultural practices, and food import/export in your country.'),
(2026,5,'Water',false,'Research water quality data for your area. Document the local source and access disparities if any.'),
(2026,6,'Fashion',false,'Research where your clothes come from. Document fast fashion''s environmental and labor impact in your regional context.'),
(2026,7,'Waste',false,'Research your city or country''s waste management system. Document recycle/landfill/burn rates and plastic pollution.'),
(2026,8,'Oceans',false,'Research the nearest major water body. Document pollution levels, biodiversity, and 1 local conservation effort.'),
(2026,9,'Climate Justice',false,'Research which communities in your country are most impacted by climate change. Document environmental disparities with 2 sources.'),
(2026,10,'Holiday',true,'Rest day. Optional: review your research and reflect on what surprised you.'),
(2026,11,'Forests',false,'Research forest cover in your country. Document deforestation drivers and reforestation efforts.'),
(2026,12,'Outdoors',false,'Research green space access in your city. Document inequities and barriers to nature access.'),
(2026,13,'Indigenous Peoples',false,'Research Indigenous communities in your country and their relationship to land and climate. Use community-led sources.'),
(2026,14,'Body',false,'Research air/water/chemical exposure data in your area and its health effects.'),
(2026,15,'Soil',false,'Research soil health in your country. Document the connection between soil and food security.'),
(2026,16,'Holiday',true,'Rest day. Optional: go outside for 20 minutes and observe your local environment.'),
(2026,17,'Food Waste',false,'Research food waste at household, restaurant, and supply-chain levels in your region.'),
(2026,18,'Wellness',false,'Research eco-anxiety or nature-deficit disorder in your country''s context.'),
(2026,19,'Connect',false,'Research environmental organisations and student activists in your region. Document 3 and how to plug in.'),
(2026,20,'Plant-Based',false,'Research meat and dairy consumption rates in your country and the availability of plant-based options.'),
(2026,21,'Fair Trade',false,'Research products your country exports/imports under exploitative conditions. Document fair trade penetration locally.'),
(2026,22,'Nature',false,'Research biodiversity in your country. Document 1 conservation success and 1 ongoing crisis.'),
(2026,23,'Purpose',false,'Research green jobs and sustainability career opportunities in your country.'),
(2026,24,'Energy',false,'Research your country''s electricity generation mix and renewable potential.'),
(2026,25,'Advocate',false,'Research a successful environmental policy change in your country and identify 1 current policy gap.'),
(2026,26,'Holiday',true,'Rest day. Optional: create a visual summary of the 5 local issues that matter most to you.'),
(2026,27,'Commitment',false,'Research a long-running environmental movement in your country and what sustains it.'),
(2026,28,'Activate',false,'Research successful campus environmental campaigns and what could be replicated on your campus.'),
(2026,29,'Reflect',false,'Synthesise your research into the 3 most urgent environmental issues in your region.'),
(2026,30,'Inspire',false,'Create a vision statement for your country''s environmental future. Include 1 photo, 1 quote, 1 data point.')
ON CONFLICT (year, day_number) DO UPDATE SET theme=EXCLUDED.theme, is_rest_day=EXCLUDED.is_rest_day, prompt=EXCLUDED.prompt;

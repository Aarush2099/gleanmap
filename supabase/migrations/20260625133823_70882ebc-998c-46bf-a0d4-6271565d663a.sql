-- 1a. Add is_milestone column
ALTER TABLE public.program_themes
  ADD COLUMN IF NOT EXISTS is_milestone boolean NOT NULL DEFAULT false;

UPDATE public.program_themes SET is_milestone = true
WHERE day_number IN (5, 10, 15, 20, 25, 30) AND year = 2026;

-- 1b. Regional contexts table
CREATE TABLE IF NOT EXISTS public.regional_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  theme text NOT NULL,
  day_number integer NOT NULL,
  year integer NOT NULL DEFAULT 2026,
  context_headline text NOT NULL,
  context_body text NOT NULL,
  priority text CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country, day_number, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regional_contexts TO authenticated;
GRANT ALL ON public.regional_contexts TO service_role;

ALTER TABLE public.regional_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regional_contexts_student_read" ON public.regional_contexts
  FOR SELECT TO authenticated
  USING (
    country = (SELECT country FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "regional_contexts_admin_insert" ON public.regional_contexts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "regional_contexts_admin_update" ON public.regional_contexts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "regional_contexts_admin_delete" ON public.regional_contexts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_regional_contexts_updated_at
  BEFORE UPDATE ON public.regional_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1c. Seed initial regional contexts
INSERT INTO public.regional_contexts (country, theme, day_number, year, context_headline, context_body, priority) VALUES
('India', 'Water', 5, 2026, 'Water stress in your region', 'India has 18% of the world''s population but only 4% of freshwater. Research water quality and access in your district — check the Central Pollution Control Board data for your river basin. Document sources of contamination, seasonal availability, and who is most affected locally.', 'critical'),
('India', 'Energy', 24, 2026, 'India''s renewable energy transition', 'India has set a target of 500 GW renewable capacity by 2030. Research the energy mix in your state — how much comes from coal vs. solar vs. hydro? Document energy access gaps in rural vs. urban areas near you.', 'high'),
('India', 'Food', 4, 2026, 'Food security and MSP in India', 'India''s agricultural policy (MSP, PDS) shapes food access for hundreds of millions. Research food insecurity rates in your district, the local impact of crop burning or soil degradation, and how the public distribution system works in your area.', 'high'),
('India', 'Waste', 7, 2026, 'Plastic and electronic waste in Indian cities', 'India generates 3.5 million tonnes of plastic waste per year. Research your city''s waste segregation infrastructure, the informal recycling economy (kabadiwalas), and any local plastic pollution hotspots you can document with photos.', 'critical'),
('India', 'Climate Justice', 9, 2026, 'Climate vulnerability in India''s most affected communities', 'Research which communities in your state face the highest climate risk — coastal erosion, floods, drought, or heatwaves. Document caste or income-based disparities in who bears the burden of environmental degradation.', 'critical'),
('Ghana', 'Water', 5, 2026, 'Water access and artisanal mining pollution', 'Illegal gold mining (galamsey) has contaminated major rivers including the Pra and Birim. Research water quality in your region, who has access to safe drinking water, and the health impacts of mining-related contamination documented by local organisations.', 'critical'),
('Ghana', 'Food', 4, 2026, 'Food systems and climate shocks in Ghana', 'Ghana''s smallholder farmers face increasing drought and flooding. Research food insecurity rates in your region, how climate variability is affecting local crops, and what support systems exist for farmers in your area.', 'high'),
('Ghana', 'Forests', 11, 2026, 'Deforestation and forest governance in Ghana', 'Ghana has lost over 90% of its original forest cover. Research deforestation rates in your region, the drivers (cocoa farming, logging, charcoal), and any community-led reforestation efforts you can document.', 'critical'),
('Ghana', 'Waste', 7, 2026, 'E-waste and plastic pollution in Ghana', 'Accra''s Agbogbloshie is one of the world''s largest e-waste sites. Research electronic and plastic waste infrastructure in your city — who handles it, what health risks exist for waste workers, and what policies are in place.', 'high'),
('Ecuador', 'Oceans', 8, 2026, 'Galápagos and coastal ecosystem protection', 'Ecuador''s Galápagos Islands are a global biodiversity hotspot under pressure from tourism and invasive species. Research coastal ecosystem health in your region — document fishing practices, marine conservation efforts, and plastic pollution reaching your coastline.', 'critical'),
('Ecuador', 'Forests', 11, 2026, 'Amazon deforestation and Indigenous land rights', 'Ecuador''s Amazon region faces oil extraction and agricultural expansion. Research deforestation rates in provinces like Sucumbíos or Orellana, Indigenous community land defence efforts, and the legal frameworks protecting the forest.', 'critical'),
('Ecuador', 'Water', 5, 2026, 'Water rights and glacier retreat in Ecuador', 'Ecuador''s glaciers are retreating rapidly, threatening water supply for millions. Research glacier loss data for Chimborazo or Cotopaxi, water access conflicts in your province, and community water governance systems.', 'high')
ON CONFLICT (country, day_number, year) DO NOTHING;

INSERT INTO public.achievements (code, name, description, icon, sort_order) VALUES
  ('first_audit',       'First Audit',        'Submit your first research entry.',                     'BookOpen',   1),
  ('field_researcher',  'Field Researcher',   'Submit research across 5 different themes.',            'Microscope', 2),
  ('streak_keeper',     'Streak Keeper',      'Submit research 3 days in a row.',                      'Flame',      3),
  ('october_complete',  'October Complete',   'Complete all 30 days of research.',                     'Calendar',   4),
  ('changemaker',       'Changemaker',        'Submit your first November action.',                    'Sparkles',   5),
  ('top_10',            'Top 10',             'Reach the global top 10 leaderboard.',                  'Trophy',     6),
  ('trailblazer',       'Trailblazer',        'First submission from your country this season.',       'Flag',       7)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION public.maybe_unlock_achievements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
  research_count int; action_count int; distinct_themes int;
  is_first_in_country boolean; current_rank bigint;
BEGIN
  SELECT count(*) INTO research_count FROM public.submissions WHERE user_id = NEW.user_id AND phase='october_research';
  SELECT count(*) INTO action_count FROM public.submissions WHERE user_id = NEW.user_id AND phase='november_action';
  SELECT count(DISTINCT theme) INTO distinct_themes FROM public.submissions WHERE user_id = NEW.user_id AND phase='october_research';

  IF research_count >= 1 THEN INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'first_audit') ON CONFLICT DO NOTHING; END IF;
  IF distinct_themes >= 5 THEN INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'field_researcher') ON CONFLICT DO NOTHING; END IF;
  IF (SELECT count(DISTINCT day_number) FROM public.submissions WHERE user_id=NEW.user_id AND phase='october_research') >= 30 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'october_complete') ON CONFLICT DO NOTHING; END IF;
  IF action_count >= 1 THEN INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'changemaker') ON CONFLICT DO NOTHING; END IF;

  IF (SELECT bool_or(consecutive_count >= 3) FROM (
    SELECT count(*) AS consecutive_count FROM (
      SELECT d, d - (row_number() OVER (ORDER BY d))::int * interval '1 day' AS grp FROM (
        SELECT DISTINCT submitted_at::date AS d FROM public.submissions WHERE user_id=NEW.user_id AND phase='october_research'
      ) s) g GROUP BY grp) c) THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'streak_keeper') ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.country IS NOT NULL THEN
    SELECT NOT EXISTS (SELECT 1 FROM public.submissions WHERE country=NEW.country AND id<>NEW.id) INTO is_first_in_country;
    IF is_first_in_country THEN
      INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'trailblazer') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  SELECT public.user_rank(NEW.user_id) INTO current_rank;
  IF current_rank IS NOT NULL AND current_rank <= 10 THEN
    INSERT INTO public.user_achievements(user_id,code) VALUES (NEW.user_id,'top_10') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $f$;

DROP TRIGGER IF EXISTS trg_maybe_unlock_achievements ON public.submissions;
CREATE TRIGGER trg_maybe_unlock_achievements AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.maybe_unlock_achievements();

ALTER TABLE public.user_achievements REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='user_achievements') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='submissions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions';
  END IF;
END $$;

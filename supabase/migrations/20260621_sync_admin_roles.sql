-- =========== ADD MISSING ROLE INFRASTRUCTURE ===========
-- The role column and admin system were defined in migrations but never applied
-- This migration adds all missing components

-- 1. Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add role column to profiles (with default 'student')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'student';

-- 3. Create admin_emails allowlist table
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- 4. Add aarushmahajan2008@gmail.com to the allowlist immediately
INSERT INTO public.admin_emails (email) 
VALUES ('aarushmahajan2008@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 6. Create enforce_admin_allowlist trigger
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
REVOKE EXECUTE ON FUNCTION public.enforce_admin_allowlist() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_enforce_admin_allowlist ON public.profiles;
CREATE TRIGGER profiles_enforce_admin_allowlist
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_allowlist();

-- 7. Auto-sync existing profiles with admin_emails (retroactive promotion)
UPDATE public.profiles
SET role = 'admin'::public.app_role
WHERE lower(email) IN (SELECT lower(email) FROM public.admin_emails)
  AND role = 'student';

-- 8. Create trigger to auto-sync when new emails added to allowlist
CREATE OR REPLACE FUNCTION public.sync_admin_role_on_email_add()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET role = 'admin'::public.app_role
    WHERE lower(email) = lower(NEW.email) AND role = 'student';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_on_email_add() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS admin_emails_sync_profiles ON public.admin_emails;
CREATE TRIGGER admin_emails_sync_profiles
  AFTER INSERT ON public.admin_emails
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_on_email_add();

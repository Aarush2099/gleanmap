-- =========== STEP 2: ADD ADMIN INFRASTRUCTURE ===========
-- This migration creates the role system, admin allowlist, and triggers
-- that were referenced in the codebase but never applied to the database

-- 1. Create the app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add role column to profiles (defaults everyone to student)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'student';

-- 3. Create admin_emails allowlist table
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_at timestamptz DEFAULT now()
);

-- 4. Seed the admin email
INSERT INTO public.admin_emails (email) 
VALUES ('aarushmahajan2008@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Create has_role() security function (SECURITY DEFINER so RLS can call it)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = _role
  );
$$;

-- 6. Immediately promote any existing profile whose email is in admin_emails
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (SELECT email FROM public.admin_emails)
  AND role != 'admin';

-- 7. Create trigger function to auto-promote on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email)
      THEN 'admin'::public.app_role
      ELSE 'student'::public.app_role
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE 
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE email = EXCLUDED.email)
      THEN 'admin'::public.app_role
      ELSE public.profiles.role
    END;
  RETURN NEW;
END;
$$;

-- 8. Create trigger on auth.users if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create trigger that auto-promotes when email added to admin_emails
CREATE OR REPLACE FUNCTION public.sync_admin_role_on_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET role = 'admin' WHERE email = NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_email_added ON public.admin_emails;
CREATE TRIGGER on_admin_email_added
  AFTER INSERT ON public.admin_emails
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_on_allowlist();

-- 10. RLS: admin_emails is never readable by clients
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_emails_no_client_access" ON public.admin_emails
  FOR ALL TO authenticated, anon USING (false);

-- 11. RLS on profiles: users see only their own, admins see all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_row" ON public.profiles;
CREATE POLICY "profiles_own_row" ON public.profiles
  FOR ALL TO authenticated
  USING (id = auth.uid() OR public.has_role('admin'));

-- 12. Verify (this should return role = 'admin' for the seeded email)
-- SELECT id, email, role FROM public.profiles 
-- WHERE email = 'aarushmahajan2008@gmail.com';

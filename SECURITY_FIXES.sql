-- ============================================================================
-- CRITICAL SECURITY FIXES FOR SUPABASE (PGC PROJECT)
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL editor to fix all vulnerabilities
-- DO NOT run line-by-line - run the entire thing at once
-- ============================================================================

-- STEP 1: DROP ALL OVERLY BROAD PUBLIC/ANON RLS POLICIES
-- ==========================================================

-- 1a. Drop all public read policies on profiles
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 1b. Drop all public read policies on user_achievements
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_achievements'
    AND roles && ARRAY['anon'::text, 'public'::text]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_achievements', pol.policyname);
  END LOOP;
END $$;

-- 1c. Drop public policies on themes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'themes'
    AND roles && ARRAY['anon'::text, 'public'::text]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.themes', pol.policyname);
  END LOOP;
END $$;

-- STEP 2: FIX PROFILES TABLE - REMOVE ANON SELECT GRANT
-- ======================================================
REVOKE SELECT ON public.profiles FROM anon;

-- Ensure only authenticated can SELECT
GRANT SELECT ON public.profiles TO authenticated;

-- STEP 3: CREATE PROPER RLS POLICIES ON PROFILES
-- ================================================

-- Drop conflicting old policies
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_row" ON public.profiles;

-- Create correct has_role function with single parameter
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

-- Revoke public execution on has_role
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

-- Own row read (users see only themselves, admins see all)
DROP POLICY IF EXISTS "profiles_own_row_select" ON public.profiles;
CREATE POLICY "profiles_own_row_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role('admin'));

-- Own row update (users can only update themselves)
DROP POLICY IF EXISTS "profiles_own_row_update" ON public.profiles;
CREATE POLICY "profiles_own_row_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert (only own profile)
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- STEP 4: BLOCK EMAIL/ROLE MANIPULATION
-- ======================================

-- Create function that prevents users from changing email or role
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email text;
BEGIN
  -- Get the actual email from auth.users (cannot be faked by the user)
  SELECT email INTO auth_email FROM auth.users WHERE id = auth.uid();

  -- Block any attempt to change email to something different from auth.users
  IF NEW.email != auth_email THEN
    RAISE EXCEPTION 'Cannot change profile email';
  END IF;

  -- Block any attempt to change role unless already admin
  IF NEW.role != OLD.role AND NOT has_role('admin') THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_integrity ON public.profiles;
CREATE TRIGGER enforce_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_update();

-- STEP 5: FIX HANDLE_NEW_USER TRIGGER
-- ===================================
-- This trigger must read from auth.users.email, NOT profiles.email
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
    NEW.email,  -- from auth.users, cannot be spoofed
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email))
      THEN 'admin'::public.app_role
      ELSE 'student'::public.app_role
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET role = CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email))
      THEN 'admin'::public.app_role
      ELSE public.profiles.role
    END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: FIX ADMIN ALLOWLIST SYNC TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_admin_role_on_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profiles WHERE the auth.users email matches, not profiles.email
  UPDATE public.profiles p
  SET role = 'admin'
  FROM auth.users u
  WHERE p.id = u.id
    AND lower(u.email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_email_added ON public.admin_emails;
CREATE TRIGGER on_admin_email_added
  AFTER INSERT ON public.admin_emails
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_on_allowlist();

-- STEP 7: SECURE ADMIN_EMAILS TABLE
-- ==================================
-- No client-side access to admin_emails
DROP POLICY IF EXISTS "admin_emails_no_client_access" ON public.admin_emails;
CREATE POLICY "admin_emails_no_client_access" ON public.admin_emails
  FOR ALL TO authenticated, anon USING (false);

-- STEP 8: FIX USER_ACHIEVEMENTS TABLE
-- ====================================

-- Drop all public read policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_achievements'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_achievements', pol.policyname);
  END LOOP;
END $$;

-- Revoke anon SELECT
REVOKE SELECT ON public.user_achievements FROM anon;

-- Create correct policies: own achievements only for users, all for admins
CREATE POLICY "achievements_own_row" ON public.user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "achievements_insert_own" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- STEP 9: FIX THEMES TABLE
-- ========================

-- Drop all public read policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'themes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.themes', pol.policyname);
  END LOOP;
END $$;

-- Authenticated users only (any logged-in user can read, but not anonymous)
CREATE POLICY "themes_authenticated_read" ON public.themes
  FOR SELECT TO authenticated
  USING (true);

-- STEP 10: REMOVE SUBMISSIONS FROM REALTIME
-- ==========================================
-- This prevents all authenticated users from seeing each other's submission updates
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS user_achievements;

-- STEP 11: FIX STORAGE POLICIES - TREE-IMAGES
-- ============================================

-- Drop overly broad storage policies
DROP POLICY IF EXISTS "tree_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "tree_images_update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket select" ON storage.objects;

-- Correct policy: only owner can delete/update their own files
-- Files MUST be uploaded to a path starting with user ID: {user_id}/{filename}
CREATE POLICY "tree_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tree-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "tree_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tree-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'tree-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create read policy for own files
CREATE POLICY "tree_images_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tree-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- STEP 12: FIX STORAGE POLICIES - SUBMISSIONS BUCKET
-- ==================================================

DROP POLICY IF EXISTS "submissions_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "submissions_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated delete for submissions" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated update for submissions" ON storage.objects;

CREATE POLICY "submissions_bucket_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "submissions_bucket_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "submissions_bucket_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- STEP 13: SET STORAGE BUCKETS TO PRIVATE
-- =======================================
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('tree-images', 'submissions', 'pgc-uploads');

-- STEP 14: REVOKE SECURITY DEFINER FUNCTIONS FROM ANON/PUBLIC
-- ===========================================================

-- These functions should not be callable by unauthenticated users
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_profile_update() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_on_allowlist() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_allowlist() FROM anon, public;

-- ============================================================================
-- VERIFICATION CHECKS (run these to confirm fixes worked)
-- ============================================================================

-- 1. Verify profiles has NO anon SELECT
SELECT 'PROFILES ANON READ' as check, 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND roles && ARRAY['anon'::text]
    AND cmd = 'SELECT'
  ) THEN 'FAIL - Still has anon read!' ELSE 'PASS' END as result;

-- 2. Verify user_achievements has NO anon SELECT
SELECT 'USER_ACHIEVEMENTS ANON READ' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_achievements' 
    AND roles && ARRAY['anon'::text]
  ) THEN 'FAIL - Still has anon policies!' ELSE 'PASS' END as result;

-- 3. Verify submissions and user_achievements NOT in Realtime
SELECT 'REALTIME PUBLICATIONS' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename IN ('submissions', 'user_achievements')
  ) THEN 'FAIL - Still in realtime!' ELSE 'PASS' END as result;

-- 4. Verify storage policies require ownership (not just IS NOT NULL)
SELECT 'STORAGE OWNERSHIP' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE definition ILIKE '%auth.uid() IS NOT NULL%'
    AND (policyname ILIKE '%delete%' OR policyname ILIKE '%update%')
  ) THEN 'FAIL - Still has overly broad policies!' ELSE 'PASS' END as result;

-- 5. Verify no public buckets with user data
SELECT 'PUBLIC BUCKETS' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE public = true 
    AND name IN ('tree-images', 'submissions', 'pgc-uploads')
  ) THEN 'FAIL - User buckets are still public!' ELSE 'PASS' END as result;

-- 6. Verify themes has NO anon SELECT
SELECT 'THEMES ANON READ' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'themes' 
    AND roles && ARRAY['anon'::text]
  ) THEN 'FAIL - Still has anon read!' ELSE 'PASS' END as result;

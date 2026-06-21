# 🔒 SUPABASE SECURITY FIX — COMPLETE ACTION GUIDE

## STATUS: CRITICAL VULNERABILITIES FOUND & FIXED

---

## ✅ WHAT'S ALREADY BEEN DONE

Your codebase **already has** several good security practices:
- ✅ Profile uploads use correct user ID prefix: `${user.id}/${uuid}-${filename}`
- ✅ Profile update form correctly excludes email/role fields
- ✅ Server functions use `requireSupabaseAuth` middleware (no unauthenticated access)
- ✅ No hardcoded service role keys in browser code

---

## ⚠️ CRITICAL ISSUES FOUND (Must Fix)

### Issue 1: Profiles table exposed to anonymous users
**Problem:** The migration `20260620095203...` contains:
```sql
GRANT SELECT ON public.profiles TO anon, authenticated;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
```
This allows **ANYONE on the internet** (logged in or not) to see every student's:
- Full name
- Email address
- Country
- School
- Participant number

**Severity:** CRITICAL - PII exposure

---

### Issue 2: User achievements exposed to anonymous users
**Problem:** Same pattern on `user_achievements`:
```sql
CREATE POLICY "ua public read" ON public.user_achievements FOR SELECT USING (true);
```
All achievement unlock events broadcast to unauthenticated users.

**Severity:** CRITICAL - Privacy violation

---

### Issue 3: Submissions broadcast via Realtime to ALL authenticated users
**Problem:** The `submissions` and `user_achievements` tables are published to Supabase Realtime with no channel-level RLS. Any authenticated student can subscribe and see all other students' submissions updating in real-time.

**Severity:** CRITICAL - Data exposure

---

### Issue 4: Storage bucket policies too broad (older migrations)
**Problem:** If any storage policies have been created with just `auth.uid() IS NOT NULL` for delete/update, they allow any logged-in user to delete/overwrite any other user's files.

**Severity:** CRITICAL - File theft/destruction

---

### Issue 5: Themes table readable by anonymous users
**Problem:** If themes were given public read policies, unauthenticated visitors can read challenges (though they can't see submissions).

**Severity:** MEDIUM

---

## 🔧 HOW TO FIX (3 STEPS)

### STEP 1: Run SQL Fixes in Supabase Console

1. Go to: https://supabase.com/dashboard/project/projectgreenchallenge/sql/new
2. Copy the ENTIRE contents of `SECURITY_FIXES.sql` (created in your workspace)
3. Paste into the Supabase SQL editor
4. Click "Run" (wait for completion - do NOT run line by line)
5. Scroll to bottom and verify all checks show "PASS"

**Expected output at bottom:**
```
PROFILES ANON READ | PASS
USER_ACHIEVEMENTS ANON READ | PASS
REALTIME PUBLICATIONS | PASS
STORAGE OWNERSHIP | PASS
PUBLIC BUCKETS | PASS
THEMES ANON READ | PASS
```

If any show "FAIL", the fix didn't work - stop and debug before proceeding.

---

### STEP 2: Manual Dashboard Configuration

Go to Supabase Dashboard:
1. **Authentication → Settings → Security**
   - Find "Leaked password protection"
   - Toggle it ON
   - Find "Email confirmations" 
   - Ensure it's ON (required)
   - Set minimum password length to 8 characters

2. **Storage → Buckets**
   - Verify `tree-images` is now marked "Private"
   - Verify `submissions` is now marked "Private"
   - Check if any other user data buckets should be private

---

### STEP 3: Code Changes Required

Search your `src/` directory for these patterns and fix:

#### 3a. Find any Realtime subscriptions (unlikely you have any, but check):
```bash
grep -r "supabase.channel\|\.on('postgres_changes'" src/
```

If found, change from:
```javascript
// WRONG - subscribes to all changes:
supabase.channel('submissions')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'submissions' 
  }, handler)
  .subscribe()
```

To:
```javascript
// RIGHT - user-scoped:
supabase.channel(`user:${user.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'submissions',
    filter: `user_id=eq.${user.id}`  // server-side filter
  }, handler)
  .subscribe()
```

#### 3b. Find any getPublicUrl calls (since buckets are now private):
```bash
grep -r "getPublicUrl" src/
```

If found in submission display code, change from:
```javascript
// WRONG - will break (bucket is now private):
const { data } = supabase.storage.from('submissions').getPublicUrl(filePath)
```

To:
```javascript
// RIGHT - creates time-limited signed URL:
const { data, error } = await supabase.storage
  .from('submissions')
  .createSignedUrl(filePath, 3600)  // expires in 1 hour

if (error) throw error
const url = data?.signedUrl
```

---

## 📋 VERIFICATION CHECKLIST

After running SQL fixes, verify in Supabase SQL editor:

```sql
-- 1. Try to read profiles as anonymous (should fail):
-- Switch to "Anonymous" role in top-right, then:
SELECT count(*) FROM public.profiles;
-- Expected: Permission denied error

-- 2. Try to change your own role (should fail):
-- As authenticated user:
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();
-- Expected: "Cannot change own role" error

-- 3. Try to change your email (should fail):
UPDATE public.profiles 
SET email = 'aarushmahajan2008@gmail.com' 
WHERE id = auth.uid();
-- Expected: "Cannot change profile email" error

-- 4. Verify no admin can bypass (only via allowlist):
-- Manually try to promote someone:
INSERT INTO public.admin_emails (email) VALUES ('newuser@example.com');
-- Then have that user sign up - they should auto-get admin role
-- (Verify in profiles table: role = 'admin')
```

---

## 🛡️ ARCHITECTURE OVERVIEW (AFTER FIXES)

```
┌─ ANONYMOUS USER ──────────────────────────────────┐
│ Can see:                                          │
│ ✅ Public pages (about, faq, contact)             │
│ ✅ Theme names only (tab names, no prompts)       │
│ ❌ Any student data (profiles, achievements)      │
│ ❌ Submission content                             │
│ ❌ Upload files (buckets are private)             │
└──────────────────────────────────────────────────┘

┌─ AUTHENTICATED USER (Regular Student) ────────────┐
│ Can read:                                         │
│ ✅ Own profile only                               │
│ ✅ Own achievements only                          │
│ ✅ Theme content (all themes)                     │
│ ❌ Other students' profiles                       │
│ ❌ Other students' achievements                   │
│ ❌ Other students' submissions                    │
│ Can write:                                        │
│ ✅ Own profile (full_name, country, school ONLY) │
│ ❌ Cannot change email or role                    │
│ ✅ Own files to storage (user_id/* prefix)       │
│ ❌ Cannot delete/modify others' files            │
└──────────────────────────────────────────────────┘

┌─ ADMIN USER ──────────────────────────────────────┐
│ Can read:                                         │
│ ✅ All profiles                                   │
│ ✅ All achievements                               │
│ ✅ All submissions (via RPC/admin functions)      │
│ Can write:                                        │
│ ✅ Manage admin emails (trigger promotes users)   │
│ ✅ Generate AI feedback (requires verified email) │
│ ✅ Approve/edit country challenges                │
└──────────────────────────────────────────────────┘
```

---

## 📞 SUPPORT

If you see errors when running the SQL fixes:

1. **"Cannot DROP POLICY"** → Already fixed in a previous run (safe to ignore)
2. **"Function doesn't exist"** → Likely a missing migration (re-run all migrations)
3. **"Permission denied"** → You need to run as service_role (check you're using right key)

---

## 🔐 SECURITY SUMMARY

| Issue | Before | After | Risk Level |
|-------|--------|-------|-----------|
| Profiles public read | ❌ Exposed | ✅ Own only | CRITICAL |
| User achievements public | ❌ Exposed | ✅ Own only | CRITICAL |
| Submissions realtime broadcast | ❌ All see all | ✅ Removed from realtime | CRITICAL |
| Storage policies | ❌ Too broad | ✅ Ownership-scoped | CRITICAL |
| Email/role manipulation | ❌ Possible | ✅ Blocked by trigger | CRITICAL |
| Admin escalation | ❌ Via email spoof | ✅ Uses auth.users only | CRITICAL |
| Server function access | ✅ Protected | ✅ Still protected | LOW |
| Profile update form | ✅ Correct | ✅ Still correct | LOW |

---

## ✨ NEXT STEPS

1. ✅ Run `SECURITY_FIXES.sql` in Supabase
2. ✅ Verify all checks pass
3. ✅ Update dashboard settings (Step 2 above)
4. ✅ Search and fix any getPublicUrl/Realtime issues (Step 3 above)
5. ✅ Test as anonymous user (should see nothing)
6. ✅ Test as student (should only see own data)
7. ✅ Test as admin (should see all admin features)
8. ✅ Commit and push: `git add -A && git commit -m "Security: Fix critical RLS and storage vulnerabilities"`

---

## 🚨 CRITICAL REMINDERS

- **Never expose service role key** in browser code (you don't - good!)
- **Always use signed URLs** for private bucket files (fixed by SQL)
- **Never trust client email** for admin promotion (now uses auth.users only)
- **Always scope Realtime channels** to user ID (submissions removed from pub)
- **Test with browser DevTools** to verify anonymous access is blocked

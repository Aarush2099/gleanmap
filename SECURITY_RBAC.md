# Security & RBAC Implementation Guide

## Overview

This document describes the security architecture, RBAC (Role-Based Access Control) system, and how secrets are managed in the PGC application.

---

## Table of Contents

1. [Architecture](#architecture)
2. [RBAC Model](#rbac-model)
3. [Secret Management](#secret-management)
4. [Authenticati on Flow](#authentication-flow)
5. [Admin Operations](#admin-operations)
6. [Security Checklist](#security-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### Server-Side Security Principle

**All privileged operations must be validated on the server.** Client-side checks are for UX only, not security.

```
User Request
    ↓
[Client: UI checks] ← For display/UX only
    ↓
[Server: RBAC validation] ← REQUIRED, cannot be bypassed
    ↓
Database/Action execution
```

### Auth Flow

1. User signs up/in with Supabase Auth
2. `auth.tsx` loads the user's profile, including their `role` field
3. Profile role is stored in the React context (not localStorage)
4. Server functions validate admin access via `has_role()` RPC or RBAC utilities
5. UI conditionally renders admin features based on validated profile role

---

## RBAC Model

### Roles

The application supports two roles:

- **`student`** (default) - Regular participant
  - Can submit research and action challenges
  - Cannot access admin panel
  - Cannot generate AI feedback or manage challenges
  
- **`admin`** - Administrator
  - Full access to admin panel
  - Can generate AI feedback for submissions
  - Can create and approve country challenges
  - Can view all submissions across users

### Role Assignment

Roles are assigned in two ways:

#### 1. At Signup (Auto-Promotion via Admin Allowlist)

When a user signs up with an email in the `ADMIN_EMAILS` list:

```
User signs up with aarushmahajan2008@gmail.com
  ↓
handle_new_user() trigger fires
  ↓
Checks if email in admin_emails table
  ↓
Sets role = 'admin' in profiles table
```

#### 2. Manual Admin Promotion

Existing users can be promoted by adding their email to the `admin_emails` table:

```sql
-- Promote a user to admin
INSERT INTO public.admin_emails (email) 
VALUES ('newadmin@example.com')
ON CONFLICT (email) DO NOTHING;

-- The sync_admin_role_on_allowlist trigger automatically promotes them
```

### RBAC Utilities

Central RBAC functions in `src/lib/rbac.ts`:

```typescript
// Check if user has a role
hasRole(user: Profile | null, role: 'admin' | 'student'): boolean

// Check if user is admin (convenience)
hasAdminAccess(user: Profile | null): boolean

// Server-side: validate email is in admin allowlist
isEmailAdmin(email: string, adminEmails: string[]): boolean

// Type guard: narrow type and validate
isAdminUser(user): user is Profile  // Use this to narrow types

// Assert user is admin, throw if not
assertAdminAccess(user): asserts user is Profile

// Assert user has role, throw if not
assertHasRole(user, role): asserts user is Profile
```

### Usage Examples

#### Frontend

```typescript
import { hasAdminAccess } from '@/lib/rbac';

function AdminPanel() {
  const { profile } = useAuth();
  
  // Check before rendering (for UX)
  if (!hasAdminAccess(profile)) {
    return <p>Not authorized</p>;
  }
  
  return <AdminContent />;
}
```

#### Server Function

```typescript
import { assertAdminAccess } from '@/lib/rbac';

export const generateAiFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    // Load user profile from Supabase
    const { data: profile } = await context.supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', context.userId)
      .single();
    
    // THIS IS REQUIRED: Validate server-side before action
    assertAdminAccess(profile);
    
    // Now safe to proceed with admin-only operation
    // ... generate AI feedback ...
  });
```

---

## Secret Management

### Secret Hierarchy

```
Server-Only (NEVER exposed to client):
├── SUPABASE_SERVICE_ROLE_KEY - Full DB access
├── LOVABLE_API_KEY - AI API access
├── SUPABASE_URL - Server config
└── ADMIN_EMAILS - Admin allowlist

Public (safe to expose via VITE_ prefix):
├── VITE_SUPABASE_PROJECT_ID - For public calls
├── VITE_SUPABASE_PUBLISHABLE_KEY - Anon key for auth
└── VITE_SUPABASE_URL - For client auth
```

### Environment Variable Setup

1. **Copy `.env.example` to `.env.local`:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in actual values in `.env.local`:**

   ```env
   # Development only - never commit this file
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PROJECT_ID=your-project-id
   SUPABASE_SERVICE_ROLE_KEY=sbp_...your-service-role-key...
   LOVABLE_API_KEY=sk_...your-lovable-api-key...
   ADMIN_EMAILS=aarushmahajan2008@gmail.com,other-admin@example.com
   ```

3. **Verify `.env.local` is in `.gitignore`:**

   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

### Accessing Secrets in Code

#### Server-Side (Safe)

```typescript
import { getRequiredEnv } from '@/lib/config.server';

// In server functions:
const apiKey = getRequiredEnv('LOVABLE_API_KEY');
// Will throw helpful error if not set during development
```

#### Client-Side (Public Only)

```typescript
// This is safe - public key only:
const { VITE_SUPABASE_PROJECT_ID } = import.meta.env;

// NEVER do this on client:
// const { SUPABASE_SERVICE_ROLE_KEY } = import.meta.env; ❌
```

### Server Startup Validation

On every server start, `validateServerConfig()` is called:

```typescript
// src/start.ts
import { validateServerConfig } from './lib/config.server';

// Fails immediately if any required env var is missing
validateServerConfig();
```

This ensures:
- ✅ Dev environment fails fast with clear error
- ✅ Production builds fail if secrets are missing
- ✅ CI/CD cannot deploy with incomplete configuration

---

## Authentication Flow

### 1. Signup

```
User enters email + password → Supabase Auth
  ↓
auth.users table created
  ↓
handle_new_user() trigger fires
  ↓
profiles table created with role = 'student' (or 'admin' if email in allowlist)
  ↓
User can now access the app
```

### 2. Login

```
User enters email + password → Supabase Auth verifies
  ↓
Session created
  ↓
auth.tsx loads profile from profiles table (includes role)
  ↓
React context updated with { user, profile, role }
  ↓
UI and server functions can check profile.role
```

### 3. Admin Page Access

```
User navigates to /admin
  ↓
Route guard: hasAdminAccess(profile)?
  ├─ YES → Render admin panel
  └─ NO  → Redirect to /hub with error toast
```

### 4. Admin Action (e.g., Generate Feedback)

```
Admin clicks "Generate AI Feedback"
  ↓
Client calls: generateAiFeedback(submissionId)
  ↓
Server validates: is user.role === 'admin'?
  ├─ NO  → Throw 403 Forbidden
  └─ YES → Execute action, call LOVABLE_API_KEY
```

---

## Admin Operations

### Available Admin Functions

#### `generateAiFeedback(submissionId: string)`

Generate AI-powered feedback for a student submission.

**Requirements:**
- User must have `role = 'admin'`
- User's email must be verified
- Submission must exist

**Example:**
```typescript
const { data, error } = await generateAiFeedback({ submissionId: '123' });
if (error) {
  if (error.message.includes('Forbidden')) {
    toast.error('Not authorized to generate feedback');
  }
}
```

#### `generateCountryChallenge(year, country, day)`

Generate a country-specific challenge based on October research submissions.

**Requirements:**
- User must have `role = 'admin'`
- Email must be verified
- At least some October research exists for the country/day

**Example:**
```typescript
const { data, error } = await generateCountryChallenge({
  year: 2026,
  country: 'USA',
  day: 5,
});
```

#### `approveCountryChallenge(year, country, day)`

Publish an approved country challenge to students.

**Requirements:**
- User must have `role = 'admin'`
- Challenge must be in 'generated' status

---

## Security Checklist

Use this checklist to verify security is properly implemented:

### RBAC

- [ ] Admin route checks `hasAdminAccess(profile)` in component
- [ ] Admin route redirects non-admins in useEffect
- [ ] No `localStorage.getItem('admin_access')` checks (client-side bypass risk)
- [ ] All admin server functions call `has_role()` RPC or `assertAdminAccess()`
- [ ] RLS policies on profiles table prevent public SELECT

### Secrets

- [ ] `.env` file is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in source code
- [ ] No `LOVABLE_API_KEY` hardcoded anywhere
- [ ] All server env access uses `getRequiredEnv()`
- [ ] Public vars use `VITE_` prefix
- [ ] GitHub Actions CI runs TruffleHog secret scan

### Testing

- [ ] Unit tests for RBAC utilities pass
- [ ] Unit tests for config validation pass
- [ ] E2E tests verify admin access control
- [ ] E2E tests verify secrets not in client
- [ ] CI runs all tests before merge

### Deployment

- [ ] Production `.env.local` is NOT in git
- [ ] Secrets are set via environment variables or vault
- [ ] Server startup validates all required env vars
- [ ] Monitoring logs admin actions

---

## Troubleshooting

### "Forbidden: admin only" Error

**Cause:** User trying to access admin feature without admin role.

**Fix:**
1. Verify user email is in `ADMIN_EMAILS` list
2. If adding new admin email, add to `admin_emails` table:
   ```sql
   INSERT INTO public.admin_emails (email) 
   VALUES ('admin@example.com')
   ON CONFLICT (email) DO NOTHING;
   ```
3. Have user sign out and back in to refresh role
4. Or manually update profile.role to 'admin'

### "LOVABLE_API_KEY not configured" Error

**Cause:** Environment variable not set.

**Fix:**
1. Copy `.env.example` to `.env.local`
2. Fill in actual `LOVABLE_API_KEY` value
3. Restart dev server
4. Verify with: `echo $LOVABLE_API_KEY`

### "Cannot change profile email" or "Cannot change own role" Error

**Cause:** User tried to change protected fields.

**Fix:**
1. Email changes must be done through Supabase Auth settings
2. Role changes must be done by another admin via admin_emails table
3. Users cannot self-promote to admin

### Admin Page Shows "Not authorized"

**Cause:** User profile role is 'student' or null.

**Fix:**
1. Verify user is logged in: check browser console for `window.SUPABASE_SESSION`
2. Verify their profile role: `await supabase.from('profiles').select('role').single()`
3. If role is 'student', add their email to admin_emails table
4. Sign out and back in to refresh

### Tests Failing with "Missing env vars"

**Cause:** Test environment doesn't have required env vars.

**Fix:**
1. CI passes dummy values for public Supabase vars
2. For local dev: `cp .env.example .env.local` and fill in values
3. Or set in shell: `export SUPABASE_SERVICE_ROLE_KEY=dummy`

---

## Security Contact

Found a security issue? Email security@projectgreenchallenge.org before disclosing publicly.

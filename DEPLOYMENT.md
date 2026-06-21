# Deployment & Secret Management Guide

## Overview

This guide covers deploying the PGC application to production while keeping secrets secure and RBAC properly configured.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variable Setup](#environment-variable-setup)
3. [Deployment Strategies](#deployment-strategies)
4. [Rollout Plan](#rollout-plan)
5. [Rollback Procedure](#rollback-procedure)
6. [Monitoring & Verification](#monitoring--verification)
7. [FAQ](#faq)

---

## Pre-Deployment Checklist

Before deploying **any** changes, verify:

### Code Quality

- [ ] All tests pass locally: `npm run test:all`
- [ ] No lint errors: `npm run lint`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

### Security

- [ ] No `.env` files in git history
- [ ] No hardcoded secrets in code
- [ ] All admin routes use server-side RBAC
- [ ] All admin functions validate `assertAdminAccess(user)`
- [ ] GitHub Actions CI passed (including TruffleHog scan)

### Database

- [ ] All migrations run: `supabase db push`
- [ ] RLS policies enabled on sensitive tables
- [ ] Admin emails properly configured in `admin_emails` table

### Secrets

- [ ] All required env vars are defined
- [ ] Service role key is rotated if exposed
- [ ] API keys are valid and in correct account
- [ ] Only necessary people have access to secrets

---

## Environment Variable Setup

### Development (`.env.local`)

**Location:** `.env.local` (gitignored, never commit)

**Setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your development values
```

**Content:**
```env
# Supabase - Development Project
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_PROJECT_ID=dev-project-id
SUPABASE_SERVICE_ROLE_KEY=sbp_...dev_key...
SUPABASE_PUBLIC_KEY=eyJhbGc...

# Public (safe to share)
VITE_SUPABASE_PROJECT_ID=dev-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_URL=https://dev-project.supabase.co

# AI API
LOVABLE_API_KEY=sk_...dev_key...

# Admin Configuration
ADMIN_EMAILS=dev-admin@example.com,yourself@example.com
```

### Staging (`.env.staging`)

**Setup:** Create via CI/CD or manually on staging server

**Values:**
- Use actual **staging Supabase project**
- Use **staging API keys**
- More restrictive admin list (only test admins)

### Production (`.env.production`)

**Storage Options:**

#### Option A: Environment Variables (Recommended for platforms like Vercel, Netlify)

Use your hosting platform's secrets UI:

```
Platform Settings → Secrets/Environment Variables

SUPABASE_URL = https://prod-project.supabase.co
SUPABASE_PROJECT_ID = prod-project-id
SUPABASE_SERVICE_ROLE_KEY = sbp_...prod_key...
LOVABLE_API_KEY = sk_...prod_key...
ADMIN_EMAILS = prod-admin1@example.com,prod-admin2@example.com
```

#### Option B: Secrets Manager (AWS Secrets Manager, Azure Vault, etc.)

1. Store secrets in your platform's secrets manager
2. Application reads from vault at startup
3. Implement in `src/lib/config.server.ts`:

```typescript
// Example: AWS Secrets Manager integration
async function getSecretsFromVault() {
  const secretsManagerClient = new SecretsManagerClient();
  const secret = await secretsManagerClient.getSecretValue({
    SecretId: 'pgc-secrets-prod'
  });
  return JSON.parse(secret.SecretString);
}
```

#### Option C: Docker/Kubernetes Secrets

Store secrets as mounted volumes:

```dockerfile
# Dockerfile
COPY --from=secrets /run/secrets/.env.local /app/.env.local
```

### Verifying Secrets are Loaded

```bash
# After deployment, verify secrets are accessible
curl https://your-app.com/health
# Should return 200 (server started successfully)

# Check server logs for startup messages
# Should NOT see: "Missing required env var: SUPABASE_SERVICE_ROLE_KEY"
```

---

## Deployment Strategies

### Staging Deployment (Before Production)

```bash
# 1. Deploy to staging branch/environment
git push origin feature/security-patches staging

# 2. Staging CI runs all tests + TruffleHog scan
# 3. Staging deploys automatically (if configured)

# 4. Run smoke tests:
# - Can you log in?
# - Can admin access /admin?
# - Can AI feedback be generated?

# 5. If staging works, proceed to production
```

### Production Deployment (Zero-Downtime)

#### Blue-Green Deployment (Recommended)

```
Blue (Current)  → Serving 100% traffic
Green (New)     → Deployed, ready

1. Deploy new code to Green
2. Run smoke tests on Green
3. Switch traffic: Blue → Green (100%)
4. Monitor Green for errors
5. Keep Blue as fallback for 24h
```

#### Rolling Deployment (Alternative)

```
1. Deploy to 25% of servers
2. Monitor error rate
3. Deploy to 50% of servers
4. Monitor error rate
5. Deploy to 100%
```

---

## Rollout Plan

### Phased Rollout Timeline

This assumes each patch is deployed incrementally, with validation between each step.

#### Phase 1: Internal Testing (1 day)

```
Audience: Development team + QA
Metrics:
  - All tests pass
  - No console errors
  - Admin panel loads
  - AI feedback generation works
  - No secrets in browser DevTools
Rollback: Delete branch, redeploy previous version
```

#### Phase 2: Staging (1-2 days)

```
Audience: QA team + select admins
Metrics:
  - All tests pass (including E2E)
  - Admin can approve submissions
  - Country challenges generate correctly
  - No performance degradation
  - Email notifications work
Rollback: Revert to previous staging version
```

#### Phase 3: Canary/Early Access (1-2 days)

```
Audience: 10% of users
Metrics:
  - Error rate < 1%
  - Response time p99 < 2s
  - No 403 Forbidden errors for admins
  - Admin operations complete successfully
Rollback: Toggle feature flag or revert deployment
```

#### Phase 4: Full Production (Gradual)

```
Monday:     Deploy to 25% (US timezones)
Tuesday:    Deploy to 50% if no errors
Wednesday:  Deploy to 75%
Thursday:   Deploy to 100%

Success Criteria:
  - Error rate remains < 0.1%
  - No spike in support tickets
  - Admin operations working
  - All tests still passing
```

### Deployment Commands

```bash
# Staging deployment
npm run build  # Ensure build succeeds
git push origin develop staging  # Trigger staging CI

# Production deployment (after staging validated)
git checkout main
git pull origin develop
git push origin main  # Triggers production CI/CD
```

### Notification Plan

```
1. Announce deployment in Slack #engineering
2. After rollout:
   - Post success metrics in #deployments
   - Include before/after error rates
   - List any rollback events
```

---

## Rollback Procedure

### Automatic Rollback (Triggered by CI)

CI automatically rolls back if:
- ✅ Tests fail
- ✅ Lint fails
- ✅ Secrets detected
- ✅ Build fails
- ✅ TypeScript errors

No action needed - deployment is blocked.

### Manual Rollback (If needed in production)

#### Scenario A: Deploy Previous Commit

```bash
# View recent commits
git log --oneline -5

# If current main is broken, revert
git revert HEAD  # Creates new commit that undoes changes
git push origin main  # Triggers new CI/deploy

# OR checkout previous commit
git checkout abc1234  # Previous working commit
git push origin main -f  # Force push (use with caution)
```

#### Scenario B: Kill Current Deployment

```bash
# If your platform supports it:
# Vercel: vercel --prod --confirm && vercel rollback
# Netlify: netlify deploy --prod --alias=rollback

# Or manually in platform UI:
# Vercel dashboard → Deployments → Click previous version → Promote
```

#### Scenario C: Database Rollback

```bash
# If database migrations caused issues:

# View applied migrations
supabase migration list

# Revert last migration locally
supabase migration down

# Push revert to production (requires careful planning)
supabase db push --dry-run  # Review changes
supabase db push  # Apply revert
```

### Rollback Verification

After rolling back, verify:

```bash
# 1. Check deployment succeeded
curl https://your-app.com/health

# 2. Test login flow
# - Can you sign in?
# - Does admin panel load for admins?

# 3. Check error logs
# - Any new errors?
# - Response times normal?

# 4. Verify data integrity
# - Can you submit data?
# - Old data still accessible?
```

### Post-Rollback Investigation

```
1. Review what failed:
   - Check CI logs for test failures
   - Check production error logs
   - Check database migration issues

2. Create issue:
   - Document exact failure
   - Include error messages and logs
   - Note when it was detected

3. Fix and redeploy:
   - Don't repeat same deployment immediately
   - Wait 30min, review again
   - Deploy to staging first
```

---

## Monitoring & Verification

### Immediate Post-Deployment (First Hour)

```bash
# Checklist
□ Application loads (no 500 error)
□ Signup works (can create new account)
□ Login works (existing account)
□ Admin can see admin panel
□ Error rate < 1%
□ Response times normal
□ No unusual log entries
```

### Short-term Monitoring (First 24 Hours)

```
Metrics to track:
- Error rate (should be < 0.5%)
- Response time p95/p99
- Database query performance
- API response times
- Admin action success rate

Alerts:
- Error rate > 5%
- Response time > 5s
- Database connection pool exhausted
- LOVABLE_API_KEY failures
```

### Validation Queries

```sql
-- Check recent admin actions
SELECT COUNT(*), error_message
FROM admin_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_message;

-- Verify admin emails are correct
SELECT email, created_at
FROM admin_emails
ORDER BY created_at DESC;

-- Check for any 403 Forbidden in logs
SELECT COUNT(*), user_id
FROM logs
WHERE status_code = 403
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id;
```

---

## FAQ

### Q: How do I add a new admin after deployment?

A: Two methods:

**Method 1: Supabase Dashboard**
1. Go to Supabase dashboard → SQL Editor
2. Run:
   ```sql
   INSERT INTO public.admin_emails (email)
   VALUES ('newadmin@example.com')
   ON CONFLICT (email) DO NOTHING;
   ```
3. User must sign out and back in

**Method 2: Environment Variable**
1. Update `ADMIN_EMAILS` environment variable to include new email
2. Restart application
3. User must sign out and back in

### Q: What if LOVABLE_API_KEY expires?

A:
1. Get new API key from Lovable dashboard
2. Update environment variable
3. No code changes needed
4. Restart application
5. Test: admin generates feedback, should work

### Q: Can I rotate secrets without downtime?

A: Yes:

1. Generate new secret in API provider
2. Update environment variable (or secrets manager)
3. Keep old secret active for 24h (for in-flight requests)
4. Monitor error logs
5. After 24h, revoke old secret

### Q: How do I test production config locally?

A:
```bash
# Use production .env values
cp .env.local .env.production.local
# Edit with prod values (if you have access)

# Build
NODE_ENV=production npm run build

# Run tests with production config
NODE_ENV=production npm run test
```

### Q: What if CI detects a secret?

A: TruffleHog blocks the merge. Steps:

1. **Remove the secret from code:**
   ```bash
   git rm --cached .env
   git commit --amend --no-edit
   git push origin feature-branch -f
   ```

2. **Rotate the secret** (if it's real):
   - Login to service (AWS, Lovable, Supabase)
   - Revoke the exposed key
   - Generate new key
   - Update in secrets manager

3. **Rerun CI:**
   - CI should now pass (no secrets detected)

### Q: I accidentally committed `.env`, what now?

A:

1. **Revoke all secrets immediately:**
   - Supabase: Regenerate service role key
   - Lovable: Regenerate API key
   - Update all secrets

2. **Remove from git history:**
   ```bash
   # Install BFG Repo Cleaner
   brew install bfg
   
   # Remove .env from all history
   bfg --delete-files .env
   
   # Force push to clear remote
   git reflog expire --expire=now --all
   git gc --aggressive --prune=now
   git push origin --force-with-lease
   ```

3. **Verify it's gone:**
   ```bash
   git log --all --full-history -- .env
   # Should show no results
   ```

---

## Questions?

Create an issue in the GitHub repo or ask in #engineering Slack.

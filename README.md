# Project Green Challenge (PGC)

A full-stack climate action platform built with TanStack Start, React, Supabase, and modern security best practices.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x+
- npm or Bun
- Supabase account (free tier ok)

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd prototypemk1-main
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local with your Supabase and API credentials

# 3. Start development server
npm run dev

# App opens at http://localhost:5173
```

## 📁 Project Structure

```
src/
├── routes/          # TanStack Start routes
├── components/      # React components
├── lib/
│   ├── rbac.ts      # Role-based access control
│   ├── auth.tsx     # Authentication context
│   └── config.server.ts  # Server config & secrets
├── integrations/    # Third-party integrations (Supabase)
└── styles.css       # Global styles

tests/
├── unit/            # Vitest unit tests
└── e2e/             # Playwright E2E tests

supabase/
└── migrations/      # Database migrations
```

## 🔐 Security & RBAC

This application implements **server-side Role-Based Access Control (RBAC)** to prevent unauthorized access to admin features.

### Admin Roles

- **Student** (default): Can submit challenges
- **Admin**: Can manage content and generate AI feedback

### Admin Access Control

All admin operations are validated server-side:

```typescript
// Example: Protecting an admin function
import { assertAdminAccess } from '@/lib/rbac';

export const generateAiFeedback = createServerFn()
  .handler(async ({ data, context }) => {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', context.userId)
      .single();
    
    // REQUIRED: Server-side validation
    assertAdminAccess(profile);
    
    // Now safe to proceed
    // ... generate feedback ...
  });
```

**Key Points:**
- ✅ Role is stored in database (`profiles.role`)
- ✅ All admin checks happen server-side
- ✅ Client-side checks are for UX only (not security)
- ✅ Every admin action validates `has_role()` RPC call

See [SECURITY_RBAC.md](./SECURITY_RBAC.md) for complete security documentation.

## 🧪 Testing

This project uses **Vitest** for unit tests and **Playwright** for E2E tests.

### Running Tests

```bash
# Run all unit tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# UI dashboard (visual test runner)
npm run test:ui

# Run E2E tests
npm run test:e2e

# E2E UI (visual test runner)
npm run test:e2e:ui

# Run all checks (lint + unit + E2E)
npm run test:all
```

### Test Structure

#### Unit Tests (`tests/unit/`)

```typescript
// tests/unit/rbac.test.ts
import { describe, it, expect } from 'vitest';
import { hasAdminAccess } from '@/lib/rbac';

describe('RBAC Utilities', () => {
  it('should return true when user is admin', () => {
    const admin = { id: '1', role: 'admin' as const };
    expect(hasAdminAccess(admin)).toBe(true);
  });
});
```

Current test suites:
- `rbac.test.ts` - RBAC utility functions (22 tests)
- `config.test.ts` - Environment variable validation (12 tests)

#### E2E Tests (`tests/e2e/`)

```typescript
// tests/e2e/admin-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('admin panel loads for authenticated admin', async ({ page }) => {
  // Navigate to admin page
  await page.goto('/admin');
  
  // Verify access control
  const adminPanel = page.locator('[data-testid="admin-panel"]');
  await expect(adminPanel).toBeVisible();
});
```

Current test suites:
- `admin-workflow.spec.ts` - Admin access control and security tests

### Test Coverage

Run tests with coverage report:

```bash
npm test -- --coverage
```

Coverage report generated in `coverage/` directory.

### Writing New Tests

#### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    expect(() => myFunction()).toThrow('Error');
  });
});
```

#### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should work as expected', async ({ page }) => {
    await page.goto('/');
    await page.fill('input', 'text');
    await page.click('button');
    await expect(page).toHaveURL('/expected-page');
  });
});
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (auto-reload)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run Vitest
npm run test:ui      # Vitest with UI
npm run test:e2e     # Run Playwright tests
npm run test:all     # Lint + test + E2E
```

### Database

```bash
# View Supabase schema
supabase db list-migrations

# Create migration
supabase migration new <name>

# Push migrations to development
supabase db push

# Reset dev database
supabase db reset
```

### Environment Variables

**Development:** `.env.local` (gitignored)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_SERVICE_ROLE_KEY=sbp_...
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-project.supabase.co
LOVABLE_API_KEY=sk_...
ADMIN_EMAILS=admin@example.com
```

See `.env.example` for complete template.

## 🚀 Deployment

### Staging

```bash
git push origin main staging
# Automatic CI/CD deploys to staging environment
```

### Production

```bash
git push origin main
# Automatic CI/CD deploys to production
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Complete environment setup
- Secrets management
- Rollout strategy
- Rollback procedures
- Monitoring & verification

## 🔍 CI/CD

GitHub Actions automatically:
- ✅ Runs ESLint and TypeScript checks
- ✅ Runs Vitest unit tests
- ✅ Runs Playwright E2E tests
- ✅ Scans for hardcoded secrets (TruffleHog)
- ✅ Verifies RBAC implementation
- ✅ Blocks merges if any checks fail

See `.github/workflows/ci.yml` for CI configuration.

## 📚 Documentation

- [SECURITY_RBAC.md](./SECURITY_RBAC.md) - Security architecture and RBAC guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment, secrets management, and rollout strategy

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test: `npm run test:all`
3. Commit with conventional commits: `git commit -m "feat: description"`
4. Push and create PR
5. CI/CD runs automatically
6. After review, merge to main

## 📖 Tech Stack

- **Frontend:** React 19, TanStack Start
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Testing:** Vitest (unit), Playwright (E2E)
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Type Safety:** TypeScript 5.8

## 📄 License

MIT

## 🆘 Support

Questions? Open an issue on GitHub or reach out in the team Slack.

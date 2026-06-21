import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

// Required environment variables for server operation
const REQUIRED_SERVER_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_PROJECT_ID',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LOVABLE_API_KEY',
];

/**
 * Validate that all required environment variables are set.
 * Call this during server startup to fail fast if config is missing.
 */
export function validateServerConfig() {
  const missing = REQUIRED_SERVER_ENV_VARS.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}. ` +
      `Copy .env.example to .env.local and fill in the values.`;
    console.error(`[Config Error] ${message}`);
    throw new Error(message);
  }
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseProjectId: process.env.SUPABASE_PROJECT_ID,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    lovableApiKey: process.env.LOVABLE_API_KEY,
    adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
    featureAdminPanel: process.env.FEATURE_ADMIN_PANEL !== 'false',
  };
}

/**
 * Get a single required environment variable, with graceful error.
 * Use this for one-off env reads in handlers.
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable not set: ${key}`);
  }
  return value;
}

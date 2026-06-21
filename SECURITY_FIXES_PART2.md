-- ============================================================================
-- STEP 15: ADDITIONAL REALTIME & AUTH FIXES
-- ============================================================================

-- These fixes complement the main SECURITY_FIXES.sql file

-- REALTIME CHANNEL SECURITY (Optional - adds extra layer)
-- ========================================================
-- If using realtime.messages table for channel restriction:

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_own_messages" ON realtime.messages;
CREATE POLICY "realtime_own_messages" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    -- Allow only messages in the user's own channel (topic matches their uid)
    topic = 'user:' || auth.uid()::text
    OR (topic LIKE 'admin:%' AND (
      SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    ))
  );

-- ============================================================================
-- EDGE FUNCTIONS - MUST ADD THESE TO SUPABASE FUNCTIONS
-- ============================================================================
-- Add this auth check to the TOP of EVERY edge function handler
-- Location: supabase/functions/*/index.ts

-- EXAMPLE FOR askPgcAi or any AI function:
/*
import { createClient } from '@supabase/supabase-js'

export default async (req: Request) => {
  // AUTH CHECK - Add this as FIRST thing
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Only THEN proceed with the AI call and the rest of the function
  // ... rest of your function logic ...
}
*/

-- ============================================================================
-- CLIENT-SIDE FUNCTION INVOCATION FIXES
-- ============================================================================
-- Update ALL supabase.functions.invoke() calls in src/ to include auth header:

/*
// FIND ALL instances of functions.invoke() in src/ and fix like this:

// BEFORE (WRONG - no auth):
const response = await supabase.functions.invoke('askPgcAi', {
  body: { message: userMessage }
})

// AFTER (CORRECT - includes auth token):
const { data: { session } } = await supabase.auth.getSession()
if (!session?.access_token) {
  throw new Error('Not authenticated')
}

const response = await supabase.functions.invoke('askPgcAi', {
  body: { message: userMessage },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
*/

-- ============================================================================
-- SIGNED URL FIXES FOR STORAGE
-- ============================================================================
-- After making buckets private (Step 10), find all getPublicUrl() calls and replace:

/*
// FIND ALL in src/ and update:

// BEFORE (getPublicUrl - will break with private buckets):
const { data } = supabase.storage.from('submissions').getPublicUrl(filePath)
const url = data?.publicUrl

// AFTER (createSignedUrl - works with private buckets, expires in 1 hour):
const { data, error } = await supabase.storage
  .from('submissions')
  .createSignedUrl(filePath, 3600)  // 3600 seconds = 1 hour

if (error) throw error
const url = data?.signedUrl

// For images displayed on page:
const { data, error } = await supabase.storage
  .from('submissions')
  .createSignedUrl(row.media_url, 3600)

if (!error && data?.signedUrl) {
  return <img src={data.signedUrl} alt="..." />
}
*/

-- ============================================================================
-- DASHBOARD SETTINGS TO UPDATE MANUALLY
-- ============================================================================
-- Go to: Supabase Dashboard → Authentication → Settings
-- 1. Enable "Leaked password protection" (Settings → Security)
-- 2. Confirm "Email confirmations" is enabled (should be ON)
-- 3. Set minimum password length to 8+ characters (if available)
-- 4. Check two-factor options

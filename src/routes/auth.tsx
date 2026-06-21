import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";

// Rate limiting: prevent brute force on auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxAttempts = 5, windowMs = 900000): boolean {
  const now = Date.now();
  const entry = authAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign In / Sign Up — PGC 2026" },
    { name: "description", content: "Create your free Project Green Challenge account or sign in." },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login" | "reset">("signup");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Rate limit check
      const key = mode === "signup" ? `signup:${email}` : `login:${email}`;
      if (!checkRateLimit(key)) {
        toast.error("Too many attempts. Try again in 15 minutes.");
        setBusy(false);
        return;
      }

      if (mode === "signup") {
        if (!country) { toast.error("Please select your country."); setBusy(false); return; }
        const redirectUrl = `${window.location.origin}/hub`;
        const { error, data } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName, country },
          },
        });
        if (error) throw error;
        // Profile is created by trigger; also patch in case trigger ran before metadata flush.
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id, email, full_name: fullName, country,
          }, { onConflict: "id" });
        }
        toast.success("Account created. Welcome to PGC!");
        navigate({ to: "/hub" });
      } else if (mode === "reset") {
        if (resetPassword !== resetPasswordConfirm) {
          toast.error("Passwords don't match");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: resetPassword });
        if (error) throw error;
        toast.success("Password reset. You can now log in.");
        setMode("login");
        setResetPassword("");
        setResetPasswordConfirm("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/hub" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const resetUrl = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetUrl });
      if (error) throw error;
      toast.success("Check your email for a password reset link.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="container-pgc py-16 max-w-md">
        <div className="flex gap-2 mb-6">
          {(["signup", "login", "reset"] as const).map((m) => {
            if (m === "reset" && mode !== "reset") return null;
            return (
              <button key={m}
                onClick={() => { setMode(m); setEmail(""); setPassword(""); }}
                className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                }`}>
                {m === "signup" ? "Sign Up" : m === "login" ? "Log In" : "Reset"}
              </button>
            );
          })}
        </div>

        <div className="glass-card p-6">
          <h1 className="text-2xl font-black">
            {mode === "signup" ? "Join PGC 2026" : mode === "login" ? "Welcome back" : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Free, takes 60 seconds." : mode === "login" ? "Pick up where you left off." : "Enter your new password"}
          </p>
          <form className="mt-5 grid gap-3" onSubmit={mode === "reset" ? onSubmit : (mode === "login" ? onSubmit : onSubmit)}>
            {mode === "signup" && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />

                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Country <span className="text-destructive">*</span>
                </label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} required
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm">
                  <option value="">— Select your country —</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
            {mode !== "reset" && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" placeholder="you@school.edu" />
              </>
            )}
            {mode === "reset" && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New password</label>
                <input type="password" required minLength={8} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm password</label>
                <input type="password" required minLength={8} value={resetPasswordConfirm} onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />
              </>
            )}
            {(mode === "signup" || mode === "login") && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />
              </>
            )}

            <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
              {busy ? "Working…" : mode === "signup" ? "Create account" : mode === "login" ? "Log in" : "Reset password"}
            </button>
          </form>
          
          {mode === "login" && (
            <form className="mt-4" onSubmit={requestPasswordReset}>
              <button type="submit" disabled={busy} className="text-sm text-primary-dark underline hover:opacity-80">
                Forgot password?
              </button>
            </form>
          )}
          
          {mode !== "reset" && (
            <p className="mt-4 text-xs text-muted-foreground">
              By continuing you agree to our <Link to="/rules" className="text-primary-dark underline">Official Rules</Link> and{" "}
              <Link to="/plagiarism" className="text-primary-dark underline">Plagiarism Statement</Link>.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}

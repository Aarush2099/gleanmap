import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CountryCombobox } from "@/components/CountryCombobox";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";


type SearchParams = { mode?: string; confirmed?: string };

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
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    mode: typeof s.mode === "string" ? s.mode : undefined,
    confirmed: typeof s.confirmed === "string" ? s.confirmed : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — PGC 2026" },
      { name: "description", content: "Create your free Project Green Challenge account or sign in." },
    ],
  }),
  component: AuthPage,
});

type View =
  | "signup"
  | "login"
  | "forgot"
  | "forgot-sent"
  | "signup-pending"
  | "reset"
  | "confirmed";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Pick initial view from URL: ?mode=reset, ?confirmed=true, else signup.
  const initialView: View =
    search.mode === "reset"
      ? "reset"
      : search.confirmed === "true"
        ? "confirmed"
        : "signup";

  const [view, setView] = useState<View>(initialView);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  // Handle ?confirmed=true — Supabase puts the session in the URL hash; supabase-js
  // auto-detects it. If a session ends up present, send the user to /hub.
  useEffect(() => {
    if (view !== "confirmed") return;
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/hub" });
    }, 1200);
    return () => clearTimeout(t);
  }, [view, navigate]);

  function setMode(next: "signup" | "login") {
    setView(next);
    setResetError(null);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!country) {
      toast.error("Please select your country.");
      return;
    }
    if (school.trim() === "") {
      toast.error("School name is required");
      return;
    }
    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}/auth?confirmed=true`;
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName, country, school: school.trim() },
        },
      });



      if (error) {
        // Supabase returns "user_already_exists" / 422 for already-confirmed emails.
        const code = (error as { code?: string }).code;
        const msg = error.message ?? "";
        if (
          code === "user_already_exists" ||
          /already (registered|exists)/i.test(msg) ||
          (error.status === 422 && /user/i.test(msg))
        ) {
          toast.error("An account with this email already exists. Please sign in instead.");
          setView("login");
          return;
        }
        throw error;
      }

      // Already-registered, unconfirmed email: Supabase returns a user with no identities + no session.
      const noIdentities =
        data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
      if (!data.session && noIdentities) {
        toast.error("An account with this email already exists. Please sign in instead.");
        setView("login");
        return;
      }

      // Success path — session won't exist until they confirm. Show holding screen.
      setPendingEmail(email);
      setView("signup-pending");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (/email not confirmed/i.test(error.message)) {
          toast.error("Please confirm your email first — check your inbox.");
          setPendingEmail(email);
          setView("signup-pending");
          return;
        }
        throw error;
      }
      toast.success("Welcome back!");
      navigate({ to: "/hub" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setPendingEmail(email);
      setView("forgot-sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!pendingEmail) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
      if (error) throw error;
      toast.success("Confirmation email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/hub" });
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not update password");
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
        {(view === "signup" || view === "login") && (
          <div className="flex gap-2 mb-6">
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                  view === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                }`}
              >
                {m === "signup" ? "Sign Up" : "Log In"}
              </button>
            ))}
          </div>
        )}

        <div className="glass-card p-6">
          {view === "signup" && (
            <>
              <h1 className="text-2xl font-black">Join PGC 2026</h1>
              <p className="text-sm text-muted-foreground mt-1">Free, takes 60 seconds.</p>
              <form className="mt-5 grid gap-3" onSubmit={handleSignup}>
                <FieldLabel>Full name</FieldLabel>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

                <FieldLabel>
                  Country <span className="text-destructive">*</span>
                </FieldLabel>
                <CountryCombobox value={country} onChange={setCountry} required />

                <FieldLabel>
                  School <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Your school or university"
                />

                <FieldLabel>Email</FieldLabel>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />

                <FieldLabel>Password</FieldLabel>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />


                <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
                  {busy ? "Working…" : "Create account"}
                </button>
              </form>
              <Terms />
            </>
          )}

          {view === "login" && (
            <>
              <h1 className="text-2xl font-black">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick up where you left off.</p>
              <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

                <FieldLabel>Password</FieldLabel>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs text-primary-dark underline self-start -mt-1"
                >
                  Forgot password?
                </button>

                <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
                  {busy ? "Working…" : "Log in"}
                </button>
              </form>
              <Terms />
            </>
          )}

          {view === "forgot" && (
            <>
              <h1 className="text-2xl font-black">Reset your password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                We'll email you a link to set a new one.
              </p>
              <form className="mt-5 grid gap-3" onSubmit={handleForgot}>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
                  {busy ? "Sending…" : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                >
                  <ArrowLeft className="size-3" /> Back to sign in
                </button>
              </form>
            </>
          )}

          {view === "forgot-sent" && (
            <Centered icon={<Mail className="size-10 text-primary" />}>
              <h1 className="text-2xl font-black">Check your email</h1>
              <p className="text-sm text-muted-foreground mt-2">
                We've sent a password reset link to <strong>{pendingEmail}</strong>. It may take a
                minute to arrive.
              </p>
              <button onClick={() => setView("login")} className="btn-outline-pgc mt-5">
                Back to sign in
              </button>
            </Centered>
          )}

          {view === "signup-pending" && (
            <Centered icon={<Mail className="size-10 text-primary" />}>
              <h1 className="text-2xl font-black">Almost there!</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Check the inbox for <strong>{pendingEmail}</strong> for a confirmation email from us.
                Click the link in it to activate your account.
              </p>
              <div className="flex flex-col gap-2 mt-5">
                <button onClick={handleResend} disabled={busy} className="btn-pgc disabled:opacity-60">
                  {busy ? "Sending…" : "Resend confirmation email"}
                </button>
                <button onClick={() => setView("login")} className="btn-outline-pgc">
                  Back to sign in
                </button>
              </div>
            </Centered>
          )}

          {view === "reset" && (
            <>
              <h1 className="text-2xl font-black">Set a new password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pick something you'll remember.
              </p>
              <form className="mt-5 grid gap-3" onSubmit={handleReset}>
                <FieldLabel>New password</FieldLabel>
                <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

                <FieldLabel>Confirm new password</FieldLabel>
                <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                {resetError && (
                  <p className="text-xs text-destructive" role="alert">{resetError}</p>
                )}

                <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
                  {busy ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}

          {view === "confirmed" && (
            <Centered icon={<CheckCircle2 className="size-10 text-primary" />}>
              <h1 className="text-2xl font-black">Email confirmed!</h1>
              <p className="text-sm text-muted-foreground mt-2">
                You're all set. Taking you to your hub…
              </p>
              <button onClick={() => navigate({ to: "/hub" })} className="btn-pgc mt-5">
                Go to hub
              </button>
            </Centered>
          )}
        </div>
      </section>
    </Layout>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm ${props.className ?? ""}`}
    />
  );
}

function Centered({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="text-center py-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Terms() {
  return (
    <p className="mt-4 text-xs text-muted-foreground">
      By continuing you agree to our{" "}
      <Link to="/rules" className="text-primary-dark underline">Official Rules</Link> and{" "}
      <Link to="/plagiarism" className="text-primary-dark underline">Plagiarism Statement</Link>.
    </p>
  );
}

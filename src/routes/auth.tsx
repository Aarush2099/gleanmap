import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign In / Sign Up — PGC 2026" },
    { name: "description", content: "Create your free Project Green Challenge account or sign in." },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
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

  return (
    <Layout>
      <section className="container-pgc py-16 max-w-md">
        <div className="flex gap-2 mb-6">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {m === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        <div className="glass-card p-6">
          <h1 className="text-2xl font-black">{mode === "signup" ? "Join PGC 2026" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Free, takes 60 seconds." : "Pick up where you left off."}
          </p>
          <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
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
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" placeholder="you@school.edu" />

            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm" />

            <button type="submit" disabled={busy} className="btn-pgc mt-2 disabled:opacity-60">
              {busy ? "Working…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            By continuing you agree to our <Link to="/rules" className="text-primary-dark underline">Official Rules</Link> and{" "}
            <Link to="/plagiarism" className="text-primary-dark underline">Plagiarism Statement</Link>.
          </p>
        </div>
      </section>
    </Layout>
  );
}

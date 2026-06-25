import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Globe, ChevronDown, LogIn, UserCircle2, Shield } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { BrandMark } from "./BrandMark";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/hub", label: "The Hub" },
  { to: "/challenges", label: "Challenges & Research" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

export function Header() {
  const { lang, setLang } = useI18n();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === "admin";

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className={`container-pgc pgc-glass--nav flex h-16 items-center gap-6 px-4 transition-[background-color,box-shadow] duration-300 ${scrolled ? "nav-scrolled" : ""}`}>
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)} aria-label="PGC Home">
          <BrandMark />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV.map((n) => (
            <Link key={n.to + n.label} to={n.to}
              className="nav-link px-3 py-2 text-sm font-medium text-foreground/75 hover:text-foreground rounded-full transition-colors"
              activeProps={{ className: "nav-link is-active text-[var(--leaf)] px-3 py-2 text-sm font-medium rounded-full" }}
              activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div ref={langRef} className="relative">
            <button onClick={() => setLangOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-white/40 border border-white/40 hover:bg-white/60 transition-colors">
              <Globe className="size-3.5" />
              {lang.toUpperCase()}
              <ChevronDown className="size-3" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 glass-panel py-1 animate-fade-in">
                {LANGS.map((l) => (
                  <button key={l.code}
                    onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/50 flex items-center justify-between ${lang === l.code ? "text-[var(--leaf)] font-semibold" : "text-foreground/80"}`}>
                    <span>{l.native}</span>
                    <span className="text-[10px] uppercase opacity-60">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAdmin && (
            <Link to="/admin"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition-all"
              style={{
                borderColor: 'rgba(251, 191, 36, 0.4)',
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                color: 'rgb(251, 191, 36)'
              }}>
              <Shield className="size-4" /> Admin
            </Link>
          )}

          {user && (
            <Link to="/certificate" className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/40 border border-white/40 hover:bg-white/60 transition-colors">
              Certificate
            </Link>
          )}

          {user ? (
            <Link to="/profile" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-white/50 border border-white/40 hover:bg-white/70 transition-colors">
              <UserCircle2 className="size-4" /> {profile?.full_name?.split(" ")[0] ?? "Profile"}
            </Link>
          ) : (
            <button onClick={() => navigate({ to: "/auth" })}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--leaf), #0BAA73)" }}>
              <LogIn className="size-4" /> Sign In
            </button>
          )}

          <button className="lg:hidden p-2 rounded-full hover:bg-white/40" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden container-pgc mt-2 glass-panel p-3">
          <div className="flex flex-col">
            {NAV.map((n) => (
              <Link key={n.to + n.label} to={n.to} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-foreground/80">
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2.5 text-sm font-semibold flex items-center gap-2" style={{ color: 'rgb(251, 191, 36)' }}>
                <Shield className="size-4" /> Admin
              </Link>
            )}
            {user && (
              <Link to="/certificate" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-foreground/80">
                Certificate
              </Link>
            )}
            <Link to={user ? "/profile" : "/auth"} onClick={() => setOpen(false)} className="py-2.5 text-sm font-semibold text-primary-dark">
              {user ? "Profile" : "Sign in"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

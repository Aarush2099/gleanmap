import { Link } from "@tanstack/react-router";
import { Linkedin, Instagram, Twitter, Heart } from "lucide-react";
import { BrandMark } from "./BrandMark";

const LINKS = [
  { to: "/contact", label: "Contact" },
  { to: "/faq", label: "FAQs" },
  { to: "/instructions", label: "Instructions" },
  { to: "/schools", label: "Schools" },
  { to: "/rules", label: "Rules" },
  { to: "/plagiarism", label: "Plagiarism Statement" },
];

export function Footer() {
  return (
    <footer className="mt-24 relative">
      <div className="container-pgc">
        <div className="glass-panel p-10 grid gap-10 md:grid-cols-3">
          <div className="md:col-span-1">
            <BrandMark />
            <p className="mt-4 text-sm text-foreground/70 max-w-md">30 days of action. One global movement.</p>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://www.linkedin.com/company/turning-green/" target="_blank" rel="noreferrer" aria-label="LinkedIn"
                className="size-10 rounded-full grid place-items-center bg-white/50 border border-white/40 hover:bg-[var(--leaf)] hover:text-white transition-colors">
                <Linkedin className="size-4" />
              </a>
              <a href="https://www.instagram.com/turninggreenorg/" target="_blank" rel="noreferrer" aria-label="Instagram"
                className="size-10 rounded-full grid place-items-center bg-white/50 border border-white/40 hover:bg-[var(--leaf)] hover:text-white transition-colors">
                <Instagram className="size-4" />
              </a>
              <a href="https://twitter.com/turninggreenorg" target="_blank" rel="noreferrer" aria-label="Twitter"
                className="size-10 rounded-full grid place-items-center bg-white/50 border border-white/40 hover:bg-[var(--leaf)] hover:text-white transition-colors">
                <Twitter className="size-4" />
              </a>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60">Program</h4>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {LINKS.map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-[var(--leaf)]">{l.label}</Link></li>
              ))}
              <li><a href="https://www.turninggreen.org" target="_blank" rel="noreferrer" className="hover:text-[var(--leaf)]">Turning Green</a></li>
            </ul>
            <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-foreground/60">PGC</h4>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li><Link to="/hub" className="hover:text-[var(--leaf)]">The Hub</Link></li>
              <li><Link to="/challenges" className="hover:text-[var(--leaf)]">Challenges & Research</Link></li>
              <li><Link to="/leaderboard" className="hover:text-[var(--leaf)]">Leaderboard</Link></li>
              <li><Link to="/climate-action-projects" className="hover:text-[var(--leaf)]">Climate Action Projects</Link></li>
            </ul>
          </div>
        </div>

        <div className="py-6 text-xs text-foreground/60 flex flex-col sm:flex-row gap-2 justify-between">
          <span>A Program of Turning Green © 2026</span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5 text-[var(--leaf)]" /> Made with care · #PGC
          </span>
        </div>
      </div>
    </footer>
  );
}

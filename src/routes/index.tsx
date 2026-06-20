import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Green Challenge — Learn. Do. Connect. Win." },
      { name: "description", content: "Project Green Challenge educates, empowers, and mobilizes students worldwide on climate action, environmental justice, and advocacy." },
      { property: "og:title", content: "Project Green Challenge" },
      { property: "og:description", content: "30 days of action. One global movement of student climate leaders." },
    ],
  }),
  component: Home,
});

const WINNERS = [
  { name: "Carolina Novillo Bravo", title: "PGC 2025 Champion", loc: "Cuenca, Ecuador" },
  { name: "Monica Annim", title: "PGC 2025 Second Place", loc: "Koforidua, Ghana" },
  { name: "Aarush Mahajan", title: "PGC 2025 Third Place (Tie)", loc: "Pune, India" },
  { name: "Charles Amoani-Antwi", title: "PGC 2025 Third Place (Tie)", loc: "Kumasi, Ghana" },
];

const STATS = [
  { n: "16,423", l: "Schools" },
  { n: "350,253", l: "Users" },
  { n: "50", l: "States" },
  { n: "185", l: "Countries" },
];

function Home() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative">
        <div className="container-pgc grid lg:grid-cols-12 gap-y-10 gap-x-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="lg:col-span-8">
            <p className="eyebrow inline-flex items-center gap-2"><Sparkles className="size-3" /> Turning Green · est. 2011</p>
            <h1 className="mt-5 text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95]">
              Project Green<br /><span className="text-primary">Challenge</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/80">
              Project Green Challenge (PGC) educates, empowers, and mobilizes high school, college, and graduate students
              on climate action, environmental and social justice, public health, and advocacy. This powerful and diverse
              call to action features 30 days of eco-themed challenges that transform lives, shift mindsets, harness ideas,
              and equip students with skills, knowledge, resources and mentorship to lead change on campus and in communities.
              Through individual and collective action, systems thinking, behavior change, and informed consumption, PGC
              participants are challenged to envision and work toward a healthy, just, resilient future.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/challenges" className="btn-pgc">See Challenges & Research <ArrowRight className="size-4" /></Link>
              <Link to="/hub" className="btn-outline-pgc">Enter your Hub</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-pgc pb-20">
        <div className="glass-card p-8 md:p-12">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-primary-dark">Unite With Students Globally To Take Climate Action</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.l} className="text-center">
                <p className="text-4xl md:text-5xl font-bold tabular-nums text-foreground">{s.n}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground">
            Since launching in 2011, Project Green Challenge has built a movement of powerful student leaders worldwide,
            engaging over 350,000 students directly and tens of millions indirectly.
          </p>
        </div>
      </section>

      {/* Program details */}
      <section className="container-pgc pb-24">
        <div className="grid lg:grid-cols-12 gap-x-8 gap-y-6">
          <div className="lg:col-span-5">
            <p className="eyebrow">// 01 — Program</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">How PGC works.</h2>
          </div>
          <div className="lg:col-span-7 text-lg leading-relaxed text-foreground/80">
            <p>
              PGC runs from October 1st until October 30th then November 1 to November 30 each year. Every day, a unique
              challenge is unveiled at 6am PST. Each challenge is live for 24 hours or more, inviting participants to
              complete actions and upload content to acquire points and prizes. Deliverables include photos, videos, creative
              and written pieces that are uploaded on the PGC site, as well as shared across social platforms. Up to twenty
              prizes will be awarded daily based on outstanding content. At the end of the 30 days, up to 14 finalists are
              selected from global participants to attend the PGC Finals and compete for the grand prize.
            </p>
          </div>
        </div>
      </section>

      {/* Winners */}
      <section className="container-pgc pb-20">
        <div className="text-center">
          <p className="eyebrow">// Honor Roll</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Congrats to PGC 2025 Winners!</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {WINNERS.map(w => (
            <div key={w.name} className="glass-card p-4">
              <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-mint/40 to-primary/20 grid place-items-center border border-white/60">
                <span className="font-mono text-xs uppercase tracking-widest text-primary-dark/60">photo</span>
              </div>
              <p className="mt-4 font-bold leading-tight">{w.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary-dark">{w.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{w.loc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/climate-action-projects" className="btn-pgc">Read About Climate Action Projects <ArrowRight className="size-4" /></Link>
        </div>

        <div className="mt-10 mx-auto max-w-3xl">
          <div className="aspect-[16/10] w-full rounded-2xl bg-gradient-to-br from-mint/30 via-white/30 to-sky/20 border border-white/60 grid place-items-center">
            <span className="font-mono text-xs uppercase tracking-widest text-primary-dark/60">featured image</span>
          </div>
        </div>
      </section>

      {/* Learn. Do. Connect. Win. + video */}
      <section className="container-pgc pb-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow">// Tagline</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Learn. Do. Connect. Win.</h2>
          <p className="mt-3 text-lg text-foreground/75">Let's Change Lives + Heal The Planet.</p>
        </div>
        <div className="mt-10 mx-auto max-w-4xl glass-card p-3">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full rounded-2xl"
              src="https://www.youtube.com/embed/CExKIH97CkM"
              title="Project Green Challenge"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}

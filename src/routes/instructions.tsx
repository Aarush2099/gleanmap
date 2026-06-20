import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/instructions")({
  head: () => ({ meta: [{ title: "Instructions — PGC 2026" }, { name: "description", content: "How to participate in PGC 2026." }] }),
  component: Instructions,
});

function Instructions() {
  const steps = [
    { t: "Register", d: "Create your account with your campus email. Add your university to plug into the team leaderboard." },
    { t: "Show up daily", d: "A new challenge unlocks each morning at 6am PT. You have 36 hours to submit before it locks." },
    { t: "Document with care", d: "Use real data, real photos, real names of places. Cite sources. Originality is the whole game." },
    { t: "Engage", d: "Comment on teammates' submissions, share on socials with #PGC2026, attend weekly office hours." },
    { t: "Stack your resume", d: "Every submission compiles into your downloadable Climate Leadership Resume." },
  ];
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Get started</p>
        <h1 className="mt-3 text-5xl font-black">Instructions.</h1>
        <ol className="mt-10 space-y-6">
          {steps.map((s, i) => (
            <li key={s.t} className="doodle-card p-6 flex gap-5">
              <div className="size-10 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground font-black">{i + 1}</div>
              <div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </Layout>
  );
}

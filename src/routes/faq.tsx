import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — PGC 2026" },
      { name: "description", content: "Everything you need to know about Project Green Challenge 2026." },
    ],
  }),
  component: FAQ,
});

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "About the Challenge",
    items: [
      { q: "What is PGC 2026?", a: "A free 30+30-day climate leadership program for students worldwide. October is research; November is action." },
      { q: "Who runs it?", a: "Turning Green, a nonprofit that has educated youth on planet and people since 2005." },
    ],
  },
  {
    title: "Eligibility",
    items: [
      { q: "Who can join?", a: "Any high school or university student, anywhere on Earth, at no cost." },
      { q: "Do I need teacher approval?", a: "No. Individuals can register directly; teachers can also enroll a class." },
    ],
  },
  {
    title: "Participation & Submissions",
    items: [
      { q: "How many challenges are there?", a: "60 — one per day, October 1 through November 29." },
      { q: "What do submissions look like?", a: "Short writeups plus photos, videos, or data. October submissions ask for regional research; November asks for documented action." },
    ],
  },
  {
    title: "Prizes & Finals",
    items: [
      { q: "What are the prizes?", a: "Daily eco-product drops, weekly scholarships, and 24 fully-funded Finals invites." },
      { q: "Where are the Finals?", a: "San Francisco, late November. Travel, lodging, and meals covered." },
    ],
  },
];

function FAQ() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Frequently asked</p>
        <h1 className="mt-3 text-5xl font-black">FAQ.</h1>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-2xl font-bold text-primary-dark">{s.title}</h2>
              <dl className="mt-4 space-y-4">
                {s.items.map((it) => (
                  <div key={it.q} className="doodle-card p-5">
                    <dt className="font-bold">{it.q}</dt>
                    <dd className="mt-2 text-sm text-muted-foreground">{it.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

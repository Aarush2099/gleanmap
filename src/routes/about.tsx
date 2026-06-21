import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Project Green Challenge 2026" },
      { name: "description", content: "Project Green Challenge is the flagship 30+30-day environmental immersion by Turning Green." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">About</p>
        <h1 className="mt-3 text-5xl font-black">Conscious. Conscientious. Active.</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Project Green Challenge (PGC) is Turning Green's flagship 30+30-day environmental immersion
          designed to engage, educate, inspire and mobilize high school and college students from
          every corner of the world.
        </p>

        <h2 className="mt-12 text-3xl font-black">The 2026 Evolution</h2>
        <p className="mt-3 text-muted-foreground">
          This year we split the program into two complementary halves: <strong>October Research</strong> —
          where each student documents environmental conditions in their own region — and
          <strong> November Action</strong>, where verified research unlocks a personalized action toolkit
          delivered on campus.
        </p>

        <h2 className="mt-12 text-3xl font-black">By the numbers</h2>
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          {[
            { v: "100K+", l: "Students engaged" },
            { v: "850", l: "Universities tracked" },
            { v: "12", l: "Years of impact" },
          ].map(x => (
            <div key={x.l} className="doodle-card p-5">
              <p className="text-4xl font-black text-primary-dark">{x.v}</p>
              <p className="text-sm text-muted-foreground mt-1">{x.l}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

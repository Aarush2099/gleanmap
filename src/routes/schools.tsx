import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GraduationCap, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/schools")({
  head: () => ({ meta: [{ title: "Schools — PGC 2026" }, { name: "description", content: "Bring PGC 2026 into your classroom or campus." }] }),
  component: Schools,
});

function Schools() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">For educators</p>
        <h1 className="mt-3 text-5xl font-black">Schools.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          PGC is used as curriculum in 800+ high schools and universities. Free standards-aligned lesson plans, rubrics,
          and progress dashboards for every educator who enrolls a class.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { i: BookOpen, t: "Lesson plans", d: "30 days of plug-and-play 45-minute modules." },
            { i: Users, t: "Class dashboard", d: "Track every student's points, streaks, and submissions." },
            { i: GraduationCap, t: "Certified hours", d: "Co-curricular credit and service-learning hours available." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="doodle-card p-6">
              <Icon className="size-7 text-primary" />
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <Link to="/contact" className="mt-10 inline-block btn-pgc">Enroll Your School</Link>
      </section>
    </Layout>
  );
}

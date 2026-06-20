import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Megaphone, Users, Award, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/campus-reps")({
  head: () => ({
    meta: [
      { title: "Campus Reps — PGC 2026" },
      { name: "description", content: "Lead PGC 2026 on your campus. Rally classmates, host events, and unlock exclusive prizes." },
    ],
  }),
  component: Reps,
});

function Reps() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Be the voice on your campus</p>
        <h1 className="mt-3 text-5xl font-black">Campus Reps.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Campus Reps are student leaders who recruit, organize, and amplify PGC across their universities. You
          set the tone — we send you the toolkit, the swag, and a dedicated mentor.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { i: Megaphone, t: "Rally", d: "Host info sessions, table on the quad, post on socials." },
            { i: Users, t: "Organize", d: "Run weekly hangs around the daily challenge themes." },
            { i: Award, t: "Earn", d: "Top reps win bonus points, gear, and Finals invites." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="doodle-card p-6">
              <Icon className="size-8 text-primary" />
              <h3 className="mt-3 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-3xl font-black">How to apply</h2>
        <ol className="mt-4 space-y-3 list-decimal list-inside text-muted-foreground">
          <li>Sign up for PGC 2026 with your campus email.</li>
          <li>Submit a 60-second video on why you want to lead.</li>
          <li>Onboard with a Turning Green mentor in September.</li>
          <li>Launch your campaign October 1.</li>
        </ol>

        <Link to="/auth" className="mt-10 btn-pgc">Apply Now <ArrowRight className="size-4" /></Link>
      </section>
    </Layout>
  );
}

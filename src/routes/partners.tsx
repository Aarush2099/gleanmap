import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { partners } from "@/lib/challenges";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners — PGC 2026" },
      { name: "description", content: "Sponsor brands and validating NGOs that make PGC 2026 possible." },
    ],
  }),
  component: Partners,
});

function Partners() {
  return (
    <Layout>
      <section className="container-pgc py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Partners</p>
        <h1 className="mt-3 text-5xl font-black">Built with the best in the movement.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          From certified B Corps to global NGOs, our partners fund prizes, validate research, and
          host finalist internships.
        </p>

        <h2 className="mt-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sponsor Brands</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {partners.slice(0, 10).map((p) => (
            <div key={p} className="doodle-card aspect-[3/2] grid place-items-center p-4 text-center">
              <span className="font-display font-black text-primary-dark">{p}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Validating NGOs</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {partners.slice(10).map((p) => (
            <div key={p} className="doodle-card aspect-[3/2] grid place-items-center p-4 text-center">
              <span className="font-display font-black text-primary-dark">{p}</span>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}

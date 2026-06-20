import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/climate-action-projects")({
  head: () => ({ meta: [
    { title: "Climate Action Projects — PGC" },
    { name: "description", content: "Explore standout student climate action projects from Project Green Challenge." },
  ]}),
  component: Page,
});

function Page() {
  return (
    <Layout>
      <section className="container-pgc py-20 max-w-3xl">
        <p className="eyebrow">// Stories</p>
        <h1 className="mt-3 text-5xl md:text-6xl font-bold tracking-tight">Climate Action Projects</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Inspiring real-world projects from PGC alumni — content coming soon.
        </p>
        <div className="mt-10 glass-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Project profiles are being assembled by the Turning Green team.</p>
          <Link to="/" className="mt-6 inline-block btn-outline-pgc">← Back home</Link>
        </div>
      </section>
    </Layout>
  );
}

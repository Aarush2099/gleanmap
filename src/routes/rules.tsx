import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/rules")({
  head: () => ({ meta: [{ title: "Official Rules — PGC 2026" }, { name: "description", content: "The official rules for Project Green Challenge 2026." }] }),
  component: Rules,
});

function Rules() {
  const rules = [
    "Open to all currently enrolled high school and university students globally; no purchase necessary.",
    "One account per participant. Multiple accounts forfeit all points.",
    "All submissions must be original work created during the program window.",
    "Submissions due within 36 hours of the daily challenge unlock; late submissions earn 50% credit until midnight PT of day 3.",
    "Judging is conducted by Turning Green staff and a rotating partner panel; decisions are final.",
    "Top 24 Finalists receive an all-expenses-paid invitation to the PGC Finals in San Francisco.",
    "Prizes are non-transferable. Cash value may not be substituted except at the sponsor's discretion.",
    "By participating you grant Turning Green a non-exclusive license to feature your submissions for educational and promotional purposes, with credit.",
  ];
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">The fine print</p>
        <h1 className="mt-3 text-5xl font-black">Official Rules.</h1>
        <ol className="mt-8 space-y-4 list-decimal list-outside pl-6 text-muted-foreground">
          {rules.map((r) => <li key={r}>{r}</li>)}
        </ol>
      </section>
    </Layout>
  );
}

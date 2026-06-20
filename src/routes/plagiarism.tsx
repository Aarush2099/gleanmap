import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/plagiarism")({
  head: () => ({ meta: [{ title: "Plagiarism Statement — PGC 2026" }, { name: "description", content: "PGC's policy on originality and academic integrity." }] }),
  component: Plagiarism,
});

function Plagiarism() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-3xl">
        <ShieldAlert className="size-10 text-primary" />
        <h1 className="mt-3 text-5xl font-black">Plagiarism Statement.</h1>
        <p className="mt-6 text-muted-foreground">
          PGC is built on the originality of student voices. Submissions must reflect your own research, observation,
          and writing. AI may be used as a thinking partner — not as a ghostwriter. Every direct quote, dataset, image,
          or idea borrowed from another source must be cited.
        </p>
        <p className="mt-4 text-muted-foreground">
          Submissions are screened against published web sources and AI-generation signatures. Any submission found to
          contain uncredited material will be disqualified for that day. A second confirmed violation removes the
          participant from the program and forfeits prior points and prizes.
        </p>
        <p className="mt-4 text-muted-foreground">
          If you're unsure how to credit a source, ask in office hours before you submit. We will always help you do
          it the right way.
        </p>
      </section>
    </Layout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Mail, Instagram, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — PGC 2026" },
      { name: "description", content: "Reach the Project Green Challenge team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Say hello</p>
        <h1 className="mt-3 text-5xl font-black">Contact.</h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Press, partnerships, school enrollments, or technical help — pick the path below and we'll route you.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <a href="mailto:hello@projectgreenchallenge.com" className="doodle-card p-6 block">
            <Mail className="size-7 text-primary" />
            <h3 className="mt-3 font-bold">Email the team</h3>
            <p className="text-sm text-muted-foreground">hello@projectgreenchallenge.com</p>
          </a>
          <a href="https://instagram.com/turninggreenorg" target="_blank" rel="noreferrer" className="doodle-card p-6 block">
            <Instagram className="size-7 text-primary" />
            <h3 className="mt-3 font-bold">Follow @turninggreenorg</h3>
            <p className="text-sm text-muted-foreground">Live drops, winners, behind-the-scenes.</p>
          </a>
          <div className="doodle-card p-6 md:col-span-2">
            <MapPin className="size-7 text-primary" />
            <h3 className="mt-3 font-bold">HQ</h3>
            <p className="text-sm text-muted-foreground">Turning Green · San Francisco, California</p>
          </div>
        </div>

        <form className="mt-12 doodle-card p-6 grid gap-4">
          <h2 className="text-2xl font-bold">Or drop us a note</h2>
          <input className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Your name" />
          <input className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Email" type="email" />
          <textarea className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm min-h-32" placeholder="Message" />
          <button type="button" className="btn-pgc self-start">Send</button>
        </form>
      </section>
    </Layout>
  );
}

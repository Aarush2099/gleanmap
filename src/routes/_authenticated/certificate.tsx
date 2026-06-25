import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Printer, ChevronDown } from "lucide-react";
import { toPng } from "html-to-image";
import { getFlagUrl } from "@/lib/flags";

export const Route = createFileRoute("/_authenticated/certificate")({
  head: () => ({ meta: [{ title: "Academic Certificate — PGC 2026" }] }),
  component: CertificatePage,
});

const MILESTONE_DAYS = [5, 10, 15, 20, 25, 30];

function CertificatePage() {
  const { profile } = useAuth();
  const docRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ research: 0, action: 0, milestone: 0 });
  const [firstAt, setFirstAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("phase,day_number,submitted_at")
        .eq("user_id", profile.id);
      const rows = data ?? [];
      let r = 0, a = 0;
      const milestoneSet = new Set<number>();
      let first: string | null = null;
      rows.forEach((row: { phase: string; day_number: number | null; submitted_at: string }) => {
        if (row.phase === "october_research") r++;
        if (row.phase === "november_action") a++;
        if (row.day_number && MILESTONE_DAYS.includes(row.day_number)) milestoneSet.add(row.day_number);
        if (!first || row.submitted_at < first) first = row.submitted_at;
      });
      setCounts({ research: r, action: a, milestone: milestoneSet.size });
      setFirstAt(first);
    })();
  }, [profile]);

  const hours = (counts.research + counts.action) * 2;
  const verificationId = profile ? `PGC-2026-${profile.id.slice(0, 8).toUpperCase()}` : "";

  async function downloadPng() {
    if (!docRef.current) return;
    try {
      const dataUrl = await toPng(docRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "pgc-certificate-2026.png";
      a.click();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  function printPdf() {
    window.print();
  }

  if (!profile) return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;

  return (
    <Layout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-doc, #certificate-doc * { visibility: visible !important; }
          #certificate-doc {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            transform: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <section className="container-pgc py-12">
        <p className="eyebrow">// Academic Credit</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Your Academic Certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          A formal certificate of participation, ready to submit to your university for credit recognition.
        </p>

        <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* LEFT — certificate document */}
          <div className="overflow-x-auto">
            <div className="mx-auto" style={{ width: 794, transformOrigin: "top left" }}>
              <div
                id="certificate-doc"
                ref={docRef}
                style={{
                  width: 794,
                  minHeight: 1123,
                  background: "white",
                  color: "#111827",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
                }}
              >
                {/* Header band */}
                <div style={{ background: "hsl(150,40%,12%)", color: "white", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.2em", margin: 0 }}>PROJECT GREEN CHALLENGE</p>
                    <p style={{ fontSize: 11, opacity: 0.65, margin: 0, marginTop: 2 }}>A Program of Turning Green</p>
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>2026</p>
                </div>

                {/* Decorative line */}
                <div style={{ height: 2, background: "linear-gradient(90deg, hsl(150,40%,40%), transparent, hsl(150,40%,40%))" }} />

                {/* Body */}
                <div style={{ padding: 48, textAlign: "center" }}>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", margin: 0 }}>Certificate of Participation</p>
                  <div style={{ height: 16 }} />
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>This certifies that</p>
                  <div style={{ height: 8 }} />
                  <h2 style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: 0, paddingBottom: 8, borderBottom: "1px solid #e5e7eb", display: "inline-block", minWidth: 360 }}>
                    {profile.full_name || "Student Name"}
                  </h2>
                  <div style={{ height: 16 }} />
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>has successfully participated in the</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "#1f2937", margin: 0, marginTop: 4 }}>Project Green Challenge 2026</p>
                  <div style={{ height: 24 }} />

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Research Submissions", value: counts.research },
                      { label: "Action Submissions", value: counts.action },
                      { label: "Milestone Days Completed", value: `${counts.milestone} / 6` },
                    ].map(s => (
                      <div key={s.label} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", margin: 0 }}>{s.label}</p>
                        <p style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0, marginTop: 4 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 16 }} />
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Estimated engagement: <b>{hours} hours</b></p>
                  <div style={{ height: 12 }} />

                  {profile.country && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <img src={getFlagUrl(profile.country, "w40")} alt="" style={{ height: 14, width: "auto", borderRadius: 2 }} crossOrigin="anonymous" />
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{profile.country}</span>
                    </div>
                  )}
                  {profile.school && (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, marginTop: 4 }}>{profile.school}</p>
                  )}

                  <div style={{ height: 24 }} />

                  <p style={{ fontSize: 11, color: "#6b7280", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
                    Project Green Challenge is a 30-day global sustainability education program run by Turning Green, engaging students from 185+ countries in environmental research, community audit, and climate action. Participants complete daily research challenges, upload evidence of local environmental conditions, and develop country-specific action plans for November. PGC is recognised as a leading youth climate leadership program internationally.
                  </p>

                  <div style={{ height: 40 }} />

                  {/* Signatures */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ height: 1, background: "#d1d5db", marginBottom: 6 }} />
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Turning Green / PGC Program</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ height: 1, background: "#d1d5db", marginBottom: 6 }} />
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                        {firstAt ? new Date(firstAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Date of Completion"}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: 32 }} />

                  {/* Verification */}
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>Verification ID: {verificationId}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, marginTop: 2 }}>Verify at: projectgreenchallenge.lovable.app/verify</p>
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, marginTop: 4, fontStyle: "italic" }}>This document certifies participation only and does not imply institutional accreditation.</p>
                  </div>
                </div>

                {/* Footer band */}
                <div style={{ background: "hsl(150,40%,12%)", color: "rgba(255,255,255,0.6)", padding: "12px 32px", textAlign: "center", fontSize: 10 }}>
                  projectgreenchallenge.lovable.app · © 2026 Turning Green
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold">Download options</h3>
              <p className="mt-1 text-xs text-muted-foreground">Submit to your institution for credit, internship hours, or USR credits.</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                {[
                  { label: "Research", v: counts.research },
                  { label: "Action", v: counts.action },
                  { label: "Milestones", v: `${counts.milestone}/6` },
                  { label: "Est. Hours", v: hours },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{s.label}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">{s.v}</p>
                  </div>
                ))}
              </div>

              <button onClick={printPdf} className="btn-pgc w-full justify-center mt-5">
                <Printer className="size-4" /> Download as PDF
              </button>
              <button onClick={downloadPng} className="btn-outline-pgc w-full justify-center mt-2">
                <Download className="size-4" /> Download as Image
              </button>
            </div>

            <div className="glass-card p-5">
              <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-bold">How to submit for academic credit</span>
                <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <ol className="mt-3 space-y-2 text-xs text-muted-foreground list-decimal pl-4">
                  <li>Download the certificate as PDF.</li>
                  <li>Contact your university's academic affairs or sustainability office.</li>
                  <li>Reference PGC as a co-curricular sustainability program (30 hours minimum engagement).</li>
                  <li>Ask about recognition under: elective credits, pre-professional internship hours, University Social Responsibility (USR) credits, or co-curricular activity records.</li>
                  <li>The verification ID on your certificate can be used to confirm your participation.</li>
                </ol>
              )}
            </div>

            <Link to="/profile" className="block text-xs text-center text-muted-foreground underline">← Back to Profile</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

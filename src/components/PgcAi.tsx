import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { askPgcAi } from "@/lib/api/pgc-ai.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function PgcAi() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await askPgcAi({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply || "…" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open PGC AI"
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full grid place-items-center text-white shadow-2xl shadow-emerald-900/30 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300/50"
        style={{ background: "linear-gradient(135deg, var(--leaf), #0BAA73)" }}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,380px)] h-[min(70vh,560px)] flex flex-col glass-panel animate-fade-in overflow-hidden">
          <header className="px-4 py-3 border-b border-white/30 flex items-center gap-3 bg-white/30">
            <div className="size-9 rounded-full grid place-items-center text-white" style={{ background: "linear-gradient(135deg, var(--leaf), #0BAA73)" }}>
              <Sparkles className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-sm">{t("ai.title")}</p>
              <p className="text-[11px] text-muted-foreground">{t("ai.subtitle")}</p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="rounded-2xl px-4 py-3 bg-white/50 border border-white/40 text-sm text-foreground/80">
                {t("ai.welcome")}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                    m.role === "user"
                      ? "bg-[var(--leaf)] text-white rounded-br-sm"
                      : "bg-white/70 border border-white/50 text-foreground rounded-bl-sm",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 bg-white/70 border border-white/50 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <form onSubmit={send} className="p-3 border-t border-white/30 bg-white/40 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              className="flex-1 rounded-full px-4 py-2 text-sm bg-white/70 border border-white/50 outline-none focus:border-[var(--leaf)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="size-10 rounded-full grid place-items-center text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--leaf), #0BAA73)" }}
              aria-label={t("ai.send")}
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

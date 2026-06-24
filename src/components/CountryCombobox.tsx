import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { getFlagThumb } from "@/lib/flags";

type Props = {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
};

// Lightweight searchable country picker that shows a real flag image per option.
export function CountryCombobox({ value, onChange, required, placeholder = "— Select your country —", id }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = query
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-input bg-white/80 px-3 py-2.5 text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          {value ? (
            <>
              <img
                src={getFlagThumb(value)}
                alt=""
                className="h-3 w-auto rounded-[2px] shrink-0"
              />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </button>

      {/* Hidden input so HTML form `required` works */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none h-0 w-0"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-2 left-0 right-0 max-h-72 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="size-3.5 opacity-60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="size-3.5 opacity-60" />
              </button>
            )}
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.map((c) => {
              const selected = c === value;
              return (
                <li key={c}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent ${
                      selected ? "bg-accent/60 font-semibold" : ""
                    }`}
                  >
                    <img src={getFlagThumb(c)} alt="" className="h-3 w-auto rounded-[2px]" />
                    <span className="truncate">{c}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted-foreground text-center">No match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

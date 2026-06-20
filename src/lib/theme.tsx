import { createContext, useContext, useEffect, type ReactNode } from "react";

// Light-mode locked per design brief. Toggle is intentionally a no-op.
type Theme = "light";
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx>({ theme: "light", toggle: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    if (typeof localStorage !== "undefined") localStorage.setItem("pgc.theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", toggle: () => {}, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

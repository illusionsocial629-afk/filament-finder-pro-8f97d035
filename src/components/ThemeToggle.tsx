import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "filora_theme";

function apply(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(KEY) as "light" | "dark" | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(saved ?? (prefersDark ? "dark" : "light"));
}

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => { apply(theme); localStorage.setItem(KEY, theme); }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle dark mode"
      className="p-2 rounded-md hover:bg-muted transition-colors"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
};

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", mode);
  }, [mode]);

  return (
    <button
      type="button"
      aria-pressed={mode === "dark"}
      onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                 bg-slate-800/60 hover:bg-slate-800 text-slate-200 ring-1 ring-white/10
                 transition"
      title="Toggle theme"
    >
      {mode === "dark" ? "Dark" : "Light"}
      <span className="i-lucide-moon dark:i-lucide-sun" />
    </button>
  );
}

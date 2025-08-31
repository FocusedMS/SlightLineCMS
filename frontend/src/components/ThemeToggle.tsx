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
      className="relative inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold
                 bg-gradient-to-r from-slate-800/60 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 
                 text-slate-200 hover:text-white border border-white/10 hover:border-purple-500/30 
                 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
      title="Toggle theme"
    >
      {mode === "dark" ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Dark
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Light
        </>
      )}
    </button>
  );
}

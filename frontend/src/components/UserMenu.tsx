import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  name?: string;
  email?: string;
  role?: "Admin" | "Blogger" | string;
  onLogout: () => void;
  showMyPosts?: boolean;
  showModeration?: boolean;
};

function initialsFrom(name?: string, email?: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  const id = (email || "").split("@")[0];
  return (id[0] ?? "?").toUpperCase();
}

function RolePill({ role }: { role?: string }) {
  const isAdmin = role?.toLowerCase() === "admin";
  const cls = isAdmin
    ? "bg-indigo-500/15 text-indigo-300"
    : "bg-emerald-500/15 text-emerald-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role || "Guest"}
    </span>
  );
}

export default function UserMenu({
  name,
  email,
  role,
  onLogout,
  showMyPosts = true,
  showModeration = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initials = initialsFrom(name, email);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-3 rounded-2xl bg-slate-800/60
                   hover:bg-slate-800 px-3 py-2 ring-1 ring-white/10 transition"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full
                     bg-gradient-to-br from-indigo-500 to-blue-500
                     text-white text-sm font-bold"
        >
          {initials}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-slate-100 text-sm font-semibold truncate max-w-[12rem]">
            {name || email || "User"}
          </span>
          <RolePill role={role} />
        </span>
        <span className="ml-1 text-slate-400 group-hover:text-slate-200">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl
                     bg-slate-900/95 backdrop-blur ring-1 ring-white/10 shadow-2xl"
        >
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-slate-100 font-medium truncate">{name || email}</div>
            <div className="text-slate-400 text-xs truncate">{email}</div>
          </div>

          <nav className="p-1 text-sm">
            {showMyPosts && (
              <Link
                to="/dashboard"
                className="block rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                My Posts
              </Link>
            )}
            {showModeration && (
              <Link
                to="/moderation"
                className="block rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Moderation
              </Link>
            )}
            <Link
              to="/editor"
              className="block rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              New Post
            </Link>
          </nav>

          <div className="border-t border-white/10 p-1">
            <button
              onClick={onLogout}
              className="w-full rounded-xl px-3 py-2 text-left text-rose-300 hover:bg-rose-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

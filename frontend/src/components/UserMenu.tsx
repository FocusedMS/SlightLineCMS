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
    ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30"
    : "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
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
        className="group relative inline-flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-800/60 to-slate-700/60
                   hover:from-slate-800 hover:to-slate-700 px-4 py-3 border border-white/10 transition-all duration-200 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
      >
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {initials}
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-white text-sm font-semibold truncate max-w-[12rem]">
            {name || email || "User"}
          </span>
          <RolePill role={role} />
        </div>
        <div className="ml-2 text-slate-400 group-hover:text-slate-200 transition-colors duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl
                     bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <div className="text-white font-semibold truncate text-lg">{name || email}</div>
            <div className="text-slate-400 text-sm truncate mt-1">{email}</div>
          </div>

          <nav className="p-2 text-sm">
            {showMyPosts && (
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-200"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My Posts
              </Link>
            )}
            {showModeration && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Admin Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  User Management
                </Link>
                <Link
                  to="/moderation"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Moderation
                </Link>
              </>
            )}
            <Link
              to="/editor"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </Link>
          </nav>

          <div className="border-t border-white/10 p-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-rose-300 hover:text-rose-200 hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-pink-500/10 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

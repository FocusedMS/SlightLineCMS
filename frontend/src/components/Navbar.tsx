import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200
         ${isActive 
           ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white shadow-lg border border-purple-500/30" 
           : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50"
         }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 -z-10" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s: RootState) => s.auth || {});

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md"></div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Sightline CMS
              </span>
              <span className="text-xs text-slate-400 font-medium">Content Management System</span>
            </div>
          </Link>

          {/* Center: Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-3">
            <NavItem to="/">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </div>
            </NavItem>
            <NavItem to="/explore">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore
              </div>
            </NavItem>
            <NavItem to="/editor">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </div>
            </NavItem>
            <NavItem to="/dashboard">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My Posts
              </div>
            </NavItem>
            {isAdmin && (
              <>
                <NavItem to="/admin">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Admin
                  </div>
                </NavItem>
                <NavItem to="/moderation">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Moderation
                  </div>
                </NavItem>
              </>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="relative">
              <ThemeToggle />
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>

            {token ? (
              <UserMenu
                name={user?.username}
                email={user?.username}
                role={user?.role}
                showMyPosts={true}
                showModeration={isAdmin}
                onLogout={() => dispatch(logout())}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="relative rounded-2xl px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="relative rounded-2xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-purple-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 -z-10"></div>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden mt-4">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/explore">Explore</NavItem>
            <NavItem to="/editor">New Post</NavItem>
            <NavItem to="/dashboard">My Posts</NavItem>
            {isAdmin && <NavItem to="/moderation">Moderation</NavItem>}
          </nav>
        </div>
      </div>
    </header>
  );
}

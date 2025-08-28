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
        `rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10
         ${isActive ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const { token, user, role } = useSelector((s: RootState) => s.auth || {});

  const isAdmin = (role || "").toLowerCase() === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        {/* Left: brand */}
        <Link to="/" className="flex items-center gap-2 mr-2">
          <span className="grid h-7 w-7 place-items-center rounded-full ring-2 ring-indigo-500">
            <span className="h-3 w-3 rounded-full bg-indigo-400" />
          </span>
          <span className="text-slate-100 font-semibold">Sightline CMS</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/explore">Explore</NavItem>
          <NavItem to="/editor">New Post</NavItem>
          <NavItem to="/dashboard">My Posts</NavItem>
          {isAdmin && <NavItem to="/moderation">Moderation</NavItem>}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />

          {token ? (
            <UserMenu
              name={user?.username}
              email={user?.email}
              role={role}
              showMyPosts={true}
              showModeration={isAdmin}
              onLogout={() => dispatch(logout())}
            />
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 ring-1 ring-white/10"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import Logo from "./Logo";

export default function Navbar() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    nav("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b header-glass">
      <div className="bg-grid absolute inset-0 opacity-30 pointer-events-none" />
      <div className="container py-3 flex items-center gap-4 relative">
        <Link to="/" className="text-xl font-semibold flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span>Sightline CMS</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/" className="btn btn-outline">Home</Link>
          <Link to="/" className="btn btn-outline">Explore</Link>
          {user && (
            <>
              <Link to="/editor" className="btn btn-outline">New Post</Link>
              <Link to="/dashboard" className="btn btn-outline">My Posts</Link>
              {user.role === 'Admin' && (
                <Link to="/moderation" className="btn btn-outline">Moderation</Link>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-1 rounded bg-gray-100">
                {user.username}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-brand-100 text-brand-700">
                {user.role}
              </span>
              <button className="btn btn-outline" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

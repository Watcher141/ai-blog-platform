import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { logoutUser } from "../firebase/authService";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { getMyProfile } from "../api/blogApi";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);

  // ✅ NEW: mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const load = async () => {
      try {
        const token = await auth.currentUser.getIdToken(true);
        const res = await getMyProfile(token);
        setProfile(res.data);
      } catch {
        setProfile(null);
      }
    };
    load();
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    navigate("/");
    setMenuOpen(false); // ✅ close menu after logout
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";
  const avatarUrl = profile?.avatar_url || user?.photoURL || null;

  return (
    <div className="navbar">
      <div className="container navbar-container">
        {/* ✅ TOP BAR (logo + hamburger) */}
        <div className="nav-top">
          <span
            className="navbar-logo"
            onClick={() => {
              navigate("/");
              setMenuOpen(false);
            }}
          >
            <span className="logo-pulse" />
            BLOG GEN
          </span>

          {/* ✅ Hamburger */}
          <div
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* ✅ Nav Links */}
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>

          {user && (
            <Link to="/my-blogs" onClick={() => setMenuOpen(false)}>
              My Blogs
            </Link>
          )}

          {!user && (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}

          {!user && (
            <Link to="/register" onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          )}

          {user && <NotificationBell />}

          {user && (
            <div className="nav-user">
              <div
                className="nav-avatar-wrap"
                onClick={() => {
                  setMenuOpen(false);
                  profile
                    ? navigate(`/u/${profile.username}`)
                    : navigate("/profile/edit");
                }}
              >
                <div className="nav-avatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={initials}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="nav-username">
                  {profile ? `@${profile.username}` : user.email?.split("@")[0]}
                </span>
              </div>

              <Link
                to="/profile/edit"
                className="nav-edit-profile"
                onClick={() => setMenuOpen(false)}
              >
                Edit Profile
              </Link>

              <button className="nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

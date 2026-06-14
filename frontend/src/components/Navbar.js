import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { logoutUser, getToken } from "../services/auth";
import { useEffect, useState } from "react";
import { getMyProfile } from "../api/blogApi";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const ac = new AbortController();
    const load = async () => {
      try {
        const token = await getToken();
        const res = await getMyProfile(token, ac.signal);
        setProfile(res.data);
      } catch (err) {
        if (err.name !== "CanceledError") setProfile(null);
      }
    };
    load();
    return () => ac.abort();
  }, [user]);

  const handleLogout = async () => {
    logoutUser();
    dispatch(logout());
    navigate("/");
    setMenuOpen(false);
  };

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";
  const avatarUrl = profile?.avatar_url || user?.photoURL || null;

  return (
    <>
      <div className="navbar">
        <div className="container navbar-container">
          {/* Logo */}
          <span className="navbar-logo" onClick={() => handleNav("/")}>
            <span className="logo-pulse" />
            BLOG GEN
          </span>

          {/* Nav links */}
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
                  onClick={() =>
                    profile
                      ? handleNav(`/u/${profile.username}`)
                      : handleNav("/profile/edit")
                  }
                >
                  <div className="nav-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <span className="nav-username">
                    {profile
                      ? `@${profile.username}`
                      : user.email?.split("@")[0]}
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

          {/* PREMIUM Hamburger */}
          <button
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Premium overlay */}
      <div
        className={`nav-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
}

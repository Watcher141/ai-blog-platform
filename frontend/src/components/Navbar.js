import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { logoutUser } from "../firebase/authService";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="navbar">
      <div className="container navbar-container">
        <span className="navbar-logo" onClick={() => navigate("/")}>
          <span className="logo-pulse" />
          AI Blog
        </span>

        <div className="nav-links">
          <Link to="/">Home</Link>
          {user && <Link to="/my-blogs">My Blogs</Link>}
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user && (
            <button className="nav-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

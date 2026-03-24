import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import { registerUser } from "../firebase/authService";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      await registerUser(email, password);
      setDone(true); // show verification message
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  // Show verification sent message
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-logo">
            <span className="auth-logo-dot" /> AI Blog
          </div>
          <h1 className="auth-title">Check your email.</h1>
          <p className="auth-subtitle" style={{ marginBottom: 24 }}>
            We sent a verification link to <strong>{email}</strong>. Please
            verify your email before logging in.
          </p>
          <button
            className="auth-btn-primary"
            onClick={() => navigate("/login")}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <span className="auth-logo-dot" /> AI Blog
        </div>
        <h1 className="auth-title">
          Create
          <br />
          account.
        </h1>
        <p className="auth-subtitle">Start writing with AI today.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <div className="auth-field">
          <input
            className="auth-input"
            placeholder="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button className="auth-btn-primary" onClick={handleRegister}>
          Create account
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

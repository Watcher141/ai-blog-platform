import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import { registerUser } from "../services/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(email, password, confirm) {
  if (!email || !EMAIL_RE.test(email)) return "Invalid email format";
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit";
  if (password !== confirm) return "Passwords do not match";
  return null;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    const err = validateForm(email, password, confirm);
    if (err) { setError(err); return; }
    try {
      await registerUser(email, password);
      setDone(true);
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
            placeholder="Password (min 8 chars, letter + digit)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <div className="auth-field">
          <input
            className="auth-input"
            placeholder="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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

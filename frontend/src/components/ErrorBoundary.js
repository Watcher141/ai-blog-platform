import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", padding: "2rem",
          color: "#fff", textAlign: "center"
        }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠</h1>
          <h2>Something went wrong</h2>
          <p style={{ color: "#999", marginBottom: "1.5rem", maxWidth: "400px" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 2rem", borderRadius: "8px", border: "none",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff", fontSize: "1rem", cursor: "pointer"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

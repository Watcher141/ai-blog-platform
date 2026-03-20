import { useState } from "react";
import { auth } from "../firebase/firebase";
import "./SEOPanel.css";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function SEOPanel({ title, content }) {
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      const res = await fetch(`${BASE_URL}/blogs/seo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      setSeo(data);
    } catch (err) {
      console.error("SEO error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return "#4ade80";
    if (score >= 50) return "#facc15";
    return "#f87171";
  };

  const readabilityColor = (r) => {
    const map = {
      Excellent: "#4ade80",
      Good: "#a3e635",
      Fair: "#facc15",
      Poor: "#f87171",
    };
    return map[r] || "#fff";
  };

  return (
    <div className="seo-panel">
      <button className="seo-trigger-btn" onClick={analyze} disabled={loading}>
        {loading ? (
          <>
            <span className="seo-spinner" /> Analyzing...
          </>
        ) : (
          "✦ SEO Analyze"
        )}
      </button>

      {open && seo && (
        <div className="seo-results">
          <div className="seo-results-header">
            <span className="seo-results-title">SEO Report</span>
            <button className="seo-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="seo-top-row">
            <div className="seo-score-box">
              <div
                className="seo-score-ring"
                style={{ "--score-color": scoreColor(seo.score) }}
              >
                <span className="seo-score-num">{seo.score}</span>
                <span className="seo-score-label">SEO Score</span>
              </div>
            </div>
            <div className="seo-meta-box">
              <div className="seo-stat">
                <span className="seo-stat-label">Readability</span>
                <span
                  className="seo-stat-value"
                  style={{ color: readabilityColor(seo.readability) }}
                >
                  {seo.readability}
                </span>
              </div>
              <div className="seo-stat">
                <span className="seo-stat-label">Word Count</span>
                <span className="seo-stat-value">{seo.word_count}</span>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-label">Meta Description</div>
            <div className="seo-meta-desc">{seo.meta_description}</div>
            <div className="seo-char-count">
              {seo.meta_description?.length}/160 chars
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-label">Focus Keywords</div>
            <div className="seo-keywords">
              {seo.focus_keywords?.map((kw) => (
                <span key={kw} className="seo-keyword">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-label">Improvement Tips</div>
            <ul className="seo-tips">
              {seo.tips?.map((tip, i) => (
                <li key={i} className="seo-tip">
                  <span className="seo-tip-icon">→</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

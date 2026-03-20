import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBlog, summarizeBlog } from "../api/blogApi";
import { useSelector } from "react-redux";
import SEOPanel from "../components/SEOPanel";
import "./BlogViewPage.css";

export default function BlogViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchBlog(id);
        setBlog(res.data);
      } catch {
        setError("Blog not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    try {
      const res = await summarizeBlog(blog.title, blog.content);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const tagsArray = blog
    ? Array.isArray(blog.tags)
      ? blog.tags
      : (blog.tags || "").split(",")
    : [];

  if (loading)
    return (
      <div className="blogview-loading">
        <div className="bv-dot" />
        <div className="bv-dot" />
        <div className="bv-dot" />
      </div>
    );

  if (error)
    return (
      <div className="blogview-error">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>← Back home</button>
      </div>
    );

  return (
    <div className="blogview-page">
      <div className="container">
        <button className="blogview-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <article className="blogview-article">
          <div className="blogview-tags">
            {tagsArray.map((tag) => (
              <span key={tag} className="tag">
                {tag.trim()}
              </span>
            ))}
          </div>

          <h1 className="blogview-title">{blog.title}</h1>

          <div className="blogview-divider" />

          {/* ✅ TLDR Box */}
          <div className="blogview-tldr">
            {!summary && (
              <button
                className="tldr-btn"
                onClick={handleSummarize}
                disabled={loadingSummary}
              >
                {loadingSummary ? (
                  <>
                    <span className="tldr-spinner" /> Summarizing...
                  </>
                ) : (
                  "✦ AI TLDR"
                )}
              </button>
            )}

            {summary && (
              <div className="tldr-result">
                <span className="tldr-label">TLDR</span>
                <p className="tldr-text">{summary}</p>
                <button className="tldr-close" onClick={() => setSummary("")}>
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="blogview-content">{blog.content}</div>

          {user && <SEOPanel title={blog.title} content={blog.content} />}
        </article>
      </div>
    </div>
  );
}

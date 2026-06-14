import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchBlog, summarizeBlog, updateCoverImage } from "../api/blogApi";
import { useSelector } from "react-redux";
import { getToken } from "../services/auth";
import { titleToGradient } from "../utils/gradient";
import SEOPanel from "../components/SEOPanel";
import LikeButton from "../components/LikeButton";
import CommentSection from "../components/CommentSection";
import "./BlogViewPage.css";

export default function BlogViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [heroImage, setHeroImage] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      try {
        const res = await fetchBlog(id, ac.signal);
        setBlog(res.data);
      } catch (err) {
        if (err.name !== "CanceledError") setError("Blog not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [id]);

  useEffect(() => {
    if (!blog) return;

    if (blog.cover_image) {
      setHeroImage({
        url: blog.cover_image,
        alt: blog.title,
      });
      return;
    }
  }, [blog]);

  const isAuthor = user && blog?.user_id && user.uid === blog.user_id;

  const handleSaveImage = async (img) => {
    try {
      const token = await getToken();
      await updateCoverImage(token, parseInt(id), img.url);
      setBlog((prev) => ({ ...prev, cover_image: img.url }));
      setHeroImage(img);
      setShowImagePicker(false);
    } catch (err) {
      console.error("Failed to save cover image:", err);
    }
  };

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
      {/* Hero Image */}
      {heroImage && (
        <div className="blogview-hero">
          {heroImage.url ? (
            <img src={heroImage.url} alt={heroImage.alt} />
          ) : (
            <div
              className="blogview-hero blogview-hero-fallback"
              style={{ background: titleToGradient(blog?.title || "") }}
            />
          )}
          <div className="blogview-hero-fade" />

          {isAuthor && (
            <button
              className="blogview-change-img"
              onClick={() => setShowImagePicker(!showImagePicker)}
            >
              {showImagePicker ? "✕ Close" : "✦ Change Image"}
            </button>
          )}
        </div>
      )}

      {showImagePicker && isAuthor && (
        <div className="blogview-img-picker">
          <div className="container">
            <div className="img-picker-search">
              <input
                className="img-picker-input"
                placeholder="Paste image URL..."
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
              />
              <button
                className="img-picker-btn"
                onClick={() => {
                  if (pickerQuery.trim()) {
                    handleSaveImage({ url: pickerQuery.trim(), alt: blog?.title || "" });
                  }
                }}
              >
                Set Image
              </button>
            </div>
          </div>
        </div>
      )}

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

          {blog.author?.username && (
            <Link to={`/u/${blog.author.username}`} className="blogview-author">
              <div className="blogview-author-avatar">
                {blog.author.avatar_url ? (
                  <img
                    src={blog.author.avatar_url}
                    alt={blog.author.username}
                  />
                ) : (
                  <span>{blog.author.username.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <span className="blogview-author-name">
                  {blog.author.display_name || `@${blog.author.username}`}
                </span>
                <span className="blogview-author-handle">
                  @{blog.author.username}
                </span>
              </div>
            </Link>
          )}

          <div className="blogview-divider" />

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

          <div className="blogview-actions">
            <LikeButton blogId={parseInt(id)} />
          </div>

          {user && <SEOPanel title={blog.title} content={blog.content} />}

          <CommentSection blogId={parseInt(id)} />
        </article>
      </div>
    </div>
  );
}

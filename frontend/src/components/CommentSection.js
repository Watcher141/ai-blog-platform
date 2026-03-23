import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { getComments, addComment, deleteComment } from "../api/blogApi";
import "./CommentSection.css";

export default function CommentSection({ blogId }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getComments(blogId);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blogId]);

  const handleSubmit = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await addComment(token, blogId, text.trim());
      setComments((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await deleteComment(token, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">
        Comments <span className="comments-count">{comments.length}</span>
      </h3>

      {/* Write comment */}
      <div className="comment-input-wrap">
        <textarea
          className="comment-input"
          placeholder={user ? "Write a comment..." : "Login to comment..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          onFocus={() => {
            if (!user) setShowLoginPrompt(true);
          }}
          readOnly={!user}
        />
        <button
          className="comment-submit"
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          {submitting ? "Posting..." : "Post →"}
        </button>
      </div>

      {/* Comments list */}
      {loading && (
        <div className="comments-loading">
          <div className="c-dot" />
          <div className="c-dot" />
          <div className="c-dot" />
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="comments-empty">No comments yet. Be the first!</p>
      )}

      <div className="comments-list">
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-avatar">
              {c.author?.avatar_url ? (
                <img src={c.author.avatar_url} alt={c.author.username} />
              ) : (
                <span>
                  {c.author?.username?.slice(0, 2).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="comment-body">
              <div className="comment-header">
                {c.author?.username ? (
                  <Link
                    to={`/u/${c.author.username}`}
                    className="comment-author"
                  >
                    {c.author.display_name || `@${c.author.username}`}
                  </Link>
                ) : (
                  <span className="comment-author">Anonymous</span>
                )}
                <span className="comment-date">{formatDate(c.created_at)}</span>
                {user && c.author?.username && (
                  <button
                    className="comment-delete"
                    onClick={() => handleDelete(c.id)}
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="comment-text">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Login prompt */}
      {showLoginPrompt && (
        <div
          className="login-prompt-overlay"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Join to comment</h3>
            <p>Create an account or log in to comment on blogs.</p>
            <div className="login-prompt-actions">
              <button
                className="login-prompt-btn-primary"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="login-prompt-btn-secondary"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
              <button
                className="login-prompt-close"
                onClick={() => setShowLoginPrompt(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

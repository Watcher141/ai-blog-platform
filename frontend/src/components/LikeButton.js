import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";
import { toggleLike, getLikeStatus } from "../api/blogApi";
import "./LikeButton.css";

export default function LikeButton({ blogId }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    const ac = new AbortController();
    const load = async () => {
      try {
        const token = await getToken();
        const res = await getLikeStatus(token, blogId, ac.signal);
        setLiked(res.data.liked);
        setCount(res.data.like_count);
      } catch (err) {
        if (err.name !== "CanceledError") console.error(err);
      }
    };
    load();
    return () => ac.abort();
  }, [user, blogId]);

  const handleLike = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const res = await toggleLike(token, blogId);
      setLiked(res.data.liked);
      setCount(res.data.like_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`like-btn ${liked ? "liked" : ""}`}
        onClick={handleLike}
        disabled={loading}
      >
        <span className="like-icon">{liked ? "♥" : "♡"}</span>
        <span className="like-count">{count}</span>
      </button>

      {showLoginPrompt && (
        <div
          className="login-prompt-overlay"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Join to like blogs</h3>
            <p>Create an account or log in to like and interact with blogs.</p>
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
    </>
  );
}

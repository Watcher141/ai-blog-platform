import "./BlogGenerator.css";
import { useState } from "react";
import { generateBlog } from "../api/blogApi";
import { auth } from "../firebase/firebase";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function BlogGenerator({ onEditBlog, onToast }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      const res = await generateBlog(freshToken, topic);
      setGeneratedBlog(res.data);
      setShowModal(true);
      setTopic("");
    } catch (err) {
      console.error(err);
      onToast
        ? onToast("Error generating blog. Please try again.", "error")
        : alert("Error generating blog.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleGenerate();
  };

  const handlePublishNow = async () => {
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      await fetch(`${BASE_URL}/blogs/${generatedBlog.id}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      setShowModal(false);
      window.location.href = `/blogs/${generatedBlog.id}`;
    } catch (err) {
      console.error(err);
      onToast
        ? onToast("Failed to publish.", "error")
        : alert("Failed to publish.");
    }
  };

  const handleEditAndPublish = () => {
    setShowModal(false);
    if (onEditBlog) onEditBlog(generatedBlog);
  };

  const handleSaveDraft = () => {
    setShowModal(false);
    onToast
      ? onToast("Saved as draft! Find it in your Drafts tab.", "info")
      : alert("Saved as draft!");
    window.location.reload();
  };

  return (
    <>
      <div className="generator-wrap">
        <div className="generator-box">
          <input
            className="generator-input"
            placeholder="What should we write about?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="generator-btn"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <>
                <span className="btn-spinner" /> Generating...
              </>
            ) : (
              "Generate →"
            )}
          </button>
        </div>
        {loading && (
          <p className="generator-hint">
            Writing your blog, this may take a few seconds...
          </p>
        )}
      </div>

      {showModal && generatedBlog && (
        <div className="gen-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="gen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gen-modal-header">
              <span className="gen-modal-tag">Blog Ready</span>
              <button
                className="gen-modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <h2 className="gen-modal-title">{generatedBlog.title}</h2>
            <p className="gen-modal-preview">
              {generatedBlog.content?.slice(0, 120)}...
            </p>
            <div className="gen-modal-actions">
              <button
                className="gen-modal-btn-primary"
                onClick={handlePublishNow}
              >
                Publish Now
              </button>
              <button
                className="gen-modal-btn-secondary"
                onClick={handleEditAndPublish}
              >
                ✏️ Edit First
              </button>
              <button className="gen-modal-btn-ghost" onClick={handleSaveDraft}>
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

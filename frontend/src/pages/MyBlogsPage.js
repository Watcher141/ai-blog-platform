import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  fetchMyBlogs,
  fetchMyDrafts,
  publishDraft,
  deleteBlog,
} from "../api/blogApi";
import BlogCard from "../components/BlogCard";
import BlogGenerator from "../components/BlogGenerator";
import BlogEditor from "../components/BlogEditor";
import SEOPanel from "../components/SEOPanel";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import { getToken } from "../services/auth";
import "./MyBlogsPage.css";

const PAGE_LIMIT = 8;

export default function MyBlogsPage() {
  const user = useSelector((state) => state.auth.user);
  const [blogs, setBlogs] = useState([]);
  const [blogsTotal, setBlogsTotal] = useState(0);
  const [drafts, setDrafts] = useState([]);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMorePub, setLoadingMorePub] = useState(false);
  const [loadingMoreDraft, setLoadingMoreDraft] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState("published");
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { toasts, showToast, removeToast } = useToast();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!user) return;
    const ac = new AbortController();
    const load = async () => {
      try {
        const freshToken = await getToken();
        const [pubRes, draftRes] = await Promise.all([
          fetchMyBlogs(freshToken, ac.signal, 0, PAGE_LIMIT),
          fetchMyDrafts(freshToken, ac.signal, 0, PAGE_LIMIT),
        ]);
        setBlogs(pubRes.data.items);
        setBlogsTotal(pubRes.data.total);
        setDrafts(draftRes.data.items);
        setDraftsTotal(draftRes.data.total);
      } catch (err) {
        if (err.name !== "CanceledError") console.error("Blog load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [user]);

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setEditorContent(blog.content || "");
    setShowEditor(true);
    setActiveTab("published");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleEditDraft = (draft) => {
    setEditingBlog(draft);
    setEditorContent(draft.content || "");
    setShowEditor(true);
    setActiveTab("published");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  // ✅ Delete handler
  const handleDelete = async (blogId, isDraft = false) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this blog? This cannot be undone.",
      )
    )
      return;
    setDeletingId(blogId);
    try {
      const freshToken = await getToken();
      await deleteBlog(freshToken, blogId);
      if (isDraft) {
        setDrafts((prev) => prev.filter((d) => d.id !== blogId));
      } else {
        setBlogs((prev) => prev.filter((b) => b.id !== blogId));
      }
      showToast("Blog deleted.", "info");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete blog.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (title, content, tags) => {
    if (!title.trim() || !content.trim()) return;
    try {
      const freshToken = await getToken();
      if (editingBlog?.id) {
        await fetch(`${BASE_URL}/blogs/${editingBlog.id}/publish`, {
          method: "POST",
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        const updatedBlog = {
          ...editingBlog,
          title,
          content,
          status: "published",
        };
        setDrafts((prev) => prev.filter((d) => d.id !== editingBlog.id));
        setBlogs((prev) => [
          updatedBlog,
          ...prev.filter((b) => b.id !== editingBlog.id),
        ]);
      } else {
        const res = await fetch(`${BASE_URL}/blogs/manual`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshToken}`,
          },
          body: JSON.stringify({ title, content, tags }),
        });
        const blog = await res.json();
        setBlogs((prev) => [blog, ...prev]);
      }
      setShowEditor(false);
      setEditorContent("");
      setEditingBlog(null);
      showToast("Blog published successfully!");
    } catch (err) {
      console.error("Publish error:", err);
      showToast("Failed to publish blog.", "error");
    }
  };

  const handleSaveDraft = async (title, content, tags) => {
    if (!title.trim() || !content.trim()) return;
    try {
      const freshToken = await getToken();
      const res = await fetch(`${BASE_URL}/blogs/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ title, content, tags }),
      });
      const blog = await res.json();
      setDrafts((prev) => [blog, ...prev]);
      setShowEditor(false);
      setEditorContent("");
      setEditingBlog(null);
      showToast("Draft saved!", "info");
    } catch (err) {
      console.error("Draft save error:", err);
      showToast("Failed to save draft.", "error");
    }
  };

  const handlePublishDraft = async (blogId) => {
    try {
      const freshToken = await getToken();
      await publishDraft(freshToken, blogId);
      const published = drafts.find((d) => d.id === blogId);
      setDrafts((prev) => prev.filter((d) => d.id !== blogId));
      setBlogs((prev) => [{ ...published, status: "published" }, ...prev]);
      showToast("Draft published!");
    } catch (err) {
      console.error("Publish draft error:", err);
      showToast("Failed to publish draft.", "error");
    }
  };

  const handleLoadMorePublished = async () => {
    setLoadingMorePub(true);
    try {
      const freshToken = await getToken();
      const res = await fetchMyBlogs(freshToken, new AbortController().signal, blogs.length, PAGE_LIMIT);
      setBlogs((prev) => [...prev, ...res.data.items]);
      setBlogsTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMorePub(false);
    }
  };

  const handleLoadMoreDrafts = async () => {
    setLoadingMoreDraft(true);
    try {
      const freshToken = await getToken();
      const res = await fetchMyDrafts(freshToken, new AbortController().signal, drafts.length, PAGE_LIMIT);
      setDrafts((prev) => [...prev, ...res.data.items]);
      setDraftsTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMoreDraft(false);
    }
  };

  return (
    <div className="myblogs-page">
      <div className="container">
        <div className="myblogs-hero">
          <div className="myblogs-tag">Your Space</div>
          <h1 className="myblogs-title">My Blogs</h1>
          <p className="myblogs-subtitle">
            {user?.email && `Writing as ${user.email}`}
          </p>
        </div>

        <BlogGenerator onEditBlog={handleEditBlog} onToast={showToast} />

        <div className="myblogs-editor-section">
          <div className="myblogs-editor-header">
            <h3 className="myblogs-editor-title">
              {editingBlog
                ? `Editing: ${editingBlog.title?.slice(0, 40)}...`
                : "Write Manually"}
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {editingBlog && (
                <button
                  className="myblogs-editor-toggle"
                  onClick={() => {
                    setEditingBlog(null);
                    setEditorContent("");
                  }}
                >
                  Clear
                </button>
              )}
              <button
                className="myblogs-editor-toggle"
                onClick={() => setShowEditor(!showEditor)}
              >
                {showEditor ? "Hide Editor" : "Open Editor"}
              </button>
            </div>
          </div>

          {showEditor && (
            <>
              <BlogEditor
                key={editingBlog?.id || "new"}
                onChange={setEditorContent}
                onPublish={handlePublish}
                onSaveDraft={handleSaveDraft}
                initialTitle={editingBlog?.title || ""}
                initialContent={editingBlog?.content || ""}
              />
              {editorContent && (
                <SEOPanel
                  title={editingBlog?.title || ""}
                  content={editorContent}
                />
              )}
            </>
          )}
        </div>

        <div className="myblogs-tabs">
          <button
            className={`myblogs-tab ${activeTab === "published" ? "active" : ""}`}
            onClick={() => setActiveTab("published")}
          >
            Published <span className="tab-count">{blogs.length}</span>
          </button>
          <button
            className={`myblogs-tab ${activeTab === "drafts" ? "active" : ""}`}
            onClick={() => setActiveTab("drafts")}
          >
            Drafts <span className="tab-count">{drafts.length}</span>
          </button>
        </div>

        {loading && (
          <div className="myblogs-loading">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        )}

        {activeTab === "published" && (
          <div className="myblogs-grid">
            {!loading && blogs.length === 0 && (
              <div className="myblogs-empty">
                <p>No published blogs yet.</p>
              </div>
            )}
            {blogs.map((blog, i) => (
              <div key={blog.id} style={{ animationDelay: `${i * 0.07}s` }}>
                <BlogCard blog={blog} />
                {/* Delete button for published blogs */}
                <div className="blog-owner-actions">
                  <button
                    className="blog-delete-btn"
                    onClick={() => handleDelete(blog.id, false)}
                    disabled={deletingId === blog.id}
                  >
                    {deletingId === blog.id ? "Deleting..." : "🗑 Delete"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && blogsTotal > blogs.length && (
              <div className="pagination-wrap">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMorePublished}
                  disabled={loadingMorePub}
                >
                  {loadingMorePub ? "Loading..." : `Load More (${blogs.length} / ${blogsTotal})`}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "drafts" && (
          <div className="myblogs-grid">
            {!loading && drafts.length === 0 && (
              <div className="myblogs-empty">
                <p>No drafts yet — save one from the editor above.</p>
              </div>
            )}
            {drafts.map((draft, i) => (
              <div
                key={draft.id}
                className="draft-item"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <BlogCard blog={draft} />
                <div className="draft-actions">
                  <button
                    className="draft-edit-btn"
                    onClick={() => handleEditDraft(draft)}
                  >
                    Edit--
                  </button>
                  <button
                    className="draft-publish-btn"
                    onClick={() => handlePublishDraft(draft.id)}
                  >
                    Publish →
                  </button>
                  {/* Delete button for drafts */}
                  <button
                    className="blog-delete-btn"
                    onClick={() => handleDelete(draft.id, true)}
                    disabled={deletingId === draft.id}
                  >
                    {deletingId === draft.id ? "Deleting..." : "🗑 Delete"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && draftsTotal > drafts.length && (
              <div className="pagination-wrap">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMoreDrafts}
                  disabled={loadingMoreDraft}
                >
                  {loadingMoreDraft ? "Loading..." : `Load More (${drafts.length} / ${draftsTotal})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

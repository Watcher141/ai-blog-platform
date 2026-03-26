import { useEffect, useState, useCallback } from "react";
import { fetchBlogs, searchBlogs } from "../api/blogApi";
import BlogCard from "../components/BlogCard";
import BlogGenerator from "../components/BlogGenerator";
import Orb from "../components/Orb";
import { useSelector } from "react-redux";
import "./HomePage.css";

export default function HomePage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchBlogs();
        setBlogs(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load blogs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = useCallback(async (e) => {
    const q = e.target.value;
    setQuery(q);

    if (!q.trim()) {
      const res = await fetchBlogs();
      setBlogs(res.data);
      return;
    }

    setSearching(true);
    try {
      const res = await searchBlogs(q);
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, []);

  return (
    <div className="home-page">
      <div className="home-hero-section">
        <div className="home-orb-wrap">
          <Orb
            hoverIntensity={2}
            rotateOnHover
            hue={81}
            forceHoverState={false}
            backgroundColor="#000000"
          />
        </div>

        <div className="home-hero-content">
          <div className="home-hero-tag">AI-Powered Writing</div>
          <h1 className="home-title">
            Ideas worth
            <br />
            <span className="home-title-italic">reading.</span>
          </h1>
          <p className="home-subtitle">
            Blogs crafted by AI, curated by humans.
          </p>
          {!user && (
            <a href="/login" className="home-hero-btn">
              Start Writing →
            </a>
          )}
        </div>

        <div className="home-scroll-hint">scroll</div>
        <div className="home-hero-fade" />
      </div>

      <div className="container">
        {user && <BlogGenerator />}

        {!user && (
          <div className="home-cta">
            <p className="home-cta-text">
              Login to generate your own AI-powered blogs and share them with
              the world.
            </p>
          </div>
        )}

        <div className="home-section-header">
          <h2 className="home-section-title">Latest Blogs</h2>
          <span className="home-section-count">
            {!loading && `${blogs.length} post${blogs.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Search bar */}
        <div className="home-search-wrap">
          <input
            className="home-search-input"
            placeholder="Search blogs by title, content or tag..."
            value={query}
            onChange={handleSearch}
          />
          {searching && <span className="home-search-spinner" />}
        </div>

        {loading && (
          <div className="home-loading">
            <div className="home-loading-dot" />
            <div className="home-loading-dot" />
            <div className="home-loading-dot" />
          </div>
        )}

        {error && <p className="home-error">{error}</p>}

        {!loading && blogs.length === 0 && (
          <div className="home-empty">
            <p>
              {query
                ? `No blogs found for "${query}"`
                : "No blogs yet. Be the first to write one."}
            </p>
          </div>
        )}

        <div className="blog-grid">
          {blogs.map((blog, i) => (
            <div key={blog.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

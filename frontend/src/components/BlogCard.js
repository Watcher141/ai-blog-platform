import "./BlogCard.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export default function BlogCard({ blog }) {
  const [coverImage, setCoverImage] = useState(null);

  const preview = blog.content
    ? blog.content.slice(0, 120) + "..."
    : "No preview available";

  const tagsArray = Array.isArray(blog.tags)
    ? blog.tags
    : (blog.tags || "").split(",");

  const searchQuery = blog.title || tagsArray[0] || "writing";

  useEffect(() => {
    //Use saved cover image if exists — don't fetch from Unsplash
    if (blog.cover_image) {
      setCoverImage(blog.cover_image);
      return;
    }

    if (!UNSPLASH_KEY) return;
    const fetchImage = async () => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
        );
        const data = await res.json();
        if (data.results?.[0]) setCoverImage(data.results[0].urls.regular);
      } catch (err) {
        console.error("Image fetch error:", err);
      }
    };
    fetchImage();
  }, [searchQuery, blog.cover_image]);

  return (
    <div className="blog-card">
      <div className="blog-card-image">
        {coverImage ? (
          <img src={coverImage} alt={blog.title} loading="lazy" />
        ) : (
          <div className="blog-card-image-placeholder">
            <span>✦</span>
          </div>
        )}
      </div>

      <div className="blog-card-body">
        {/* Author */}
        {blog.author?.username && (
          <Link to={`/u/${blog.author.username}`} className="blog-card-author">
            <div className="blog-card-author-avatar">
              {blog.author.avatar_url ? (
                <img src={blog.author.avatar_url} alt={blog.author.username} />
              ) : (
                <span>{blog.author.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span>@{blog.author.username}</span>
          </Link>
        )}

        <h2>{blog.title}</h2>
        <p>{preview}</p>

        <div className="blog-tags">
          {tagsArray.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag.trim()}
            </span>
          ))}
        </div>

        <Link to={`/blogs/${blog.id}`} className="blog-card-read">
          Read More →
        </Link>
      </div>
    </div>
  );
}

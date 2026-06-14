import "./BlogCard.css";
import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  const coverImage = blog.cover_image || null;

  const preview = blog.content
    ? blog.content.slice(0, 120) + "..."
    : "No preview available";

  const tagsArray = Array.isArray(blog.tags)
    ? blog.tags
    : (blog.tags || "").split(",");

  return (
    <div className="blog-card">
      <div className="blog-card-image">
        {coverImage ? (
          <img src={coverImage} alt={blog.title} loading="lazy" />
        ) : (
          <div
            className="blog-card-image-placeholder"
            style={{ background: `linear-gradient(135deg, hsl(${blog.title?.length * 37 % 360}, 50%, 25%), hsl(${(blog.title?.length * 37 + 60) % 360}, 50%, 15%))` }}
          >
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

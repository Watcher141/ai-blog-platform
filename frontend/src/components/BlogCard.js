import "./BlogCard.css";
import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  const preview = blog.content
    ? blog.content.slice(0, 150) + "..."
    : "No preview available";

  const tagsArray = Array.isArray(blog.tags)
    ? blog.tags
    : (blog.tags || "").split(",");

  return (
    <div className="blog-card">
      <h2>{blog.title}</h2>
      <p>{preview}</p>

      <div className="blog-tags">
        {tagsArray.map((tag) => (
          <span key={tag} className="tag">
            {tag.trim()}
          </span>
        ))}
      </div>

      <Link to={`/blogs/${blog.id}`}>Read More →</Link>
    </div>
  );
}

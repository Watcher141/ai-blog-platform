from database import SessionLocal
from models import Blog


def create_blog(title, content, tags, user_id, status="published"):
    db = SessionLocal()
    blog = Blog(
        title=title,
        content=content,
        tags=tags,
        user_id=user_id,
        status=status  # ✅ support draft/published
    )
    db.add(blog)
    db.commit()
    db.refresh(blog)
    db.close()
    return blog


def get_user_blogs(user_id, status="published"):
    db = SessionLocal()
    blogs = db.query(Blog).filter(
        Blog.user_id == user_id,
        Blog.status == status  # ✅ filter by status
    ).order_by(Blog.created_at.desc()).all()
    db.close()
    return blogs


def get_all_blogs():
    db = SessionLocal()
    blogs = db.query(Blog).filter(
        Blog.status == "published"  # ✅ only show published on public feed
    ).order_by(Blog.created_at.desc()).all()
    db.close()
    return blogs


def get_blog(blog_id):
    db = SessionLocal()
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    db.close()
    return blog


def update_blog_status(blog_id, status):
    db = SessionLocal()
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if blog:
        blog.status = status
        db.commit()
        db.refresh(blog)
    db.close()
    return blog


def update_blog(blog_id, title=None, content=None, tags=None):
    db = SessionLocal()
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if blog:
        if title is not None: blog.title = title
        if content is not None: blog.content = content
        if tags is not None: blog.tags = tags
        db.commit()
        db.refresh(blog)
    db.close()
    return blog


def delete_blog(blog_id):
    db = SessionLocal()
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if blog:
        db.delete(blog)
        db.commit()
    db.close()
    return blog
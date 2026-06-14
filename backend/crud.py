from database import SessionLocal
from models import Blog, UserProfile, Like, Comment, Follow, Notification


def _session():
    return SessionLocal()


def _blog_to_dict(b):
    if b is None:
        return None
    return {
        "id": b.id, "title": b.title, "content": b.content,
        "tags": b.tags, "status": b.status, "user_id": b.user_id,
        "cover_image": b.cover_image, "summary": b.summary,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }

def create_blog(title, content, tags, user_id, status="published"):
    title = (title or "").strip()
    content = (content or "").strip()
    tags = (tags or "").strip()
    if not title:
        raise ValueError("title is required")
    if not content:
        raise ValueError("content is required")
    db = _session()
    try:
        blog = Blog(title=title, content=content, tags=tags, user_id=user_id, status=status)
        db.add(blog)
        db.commit()
        db.refresh(blog)
        return _blog_to_dict(blog)
    finally:
        db.close()

def get_user_blogs(user_id, status="published", skip=0, limit=20):
    db = _session()
    try:
        blogs = db.query(Blog).filter(
            Blog.user_id == user_id,
            Blog.status == status
        ).order_by(Blog.created_at.desc()).offset(skip).limit(limit).all()
        return [_blog_to_dict(b) for b in blogs]
    finally:
        db.close()

def get_user_blogs_count(user_id, status="published"):
    db = _session()
    try:
        return db.query(Blog).filter(
            Blog.user_id == user_id,
            Blog.status == status
        ).count()
    finally:
        db.close()

def get_all_blogs(skip=0, limit=20):
    db = _session()
    try:
        blogs = db.query(Blog).filter(
            Blog.status == "published"
        ).order_by(Blog.created_at.desc()).offset(skip).limit(limit).all()
        return [_blog_to_dict(b) for b in blogs]
    finally:
        db.close()

def get_all_blogs_count():
    db = _session()
    try:
        return db.query(Blog).filter(Blog.status == "published").count()
    finally:
        db.close()

def get_blog(blog_id):
    db = _session()
    try:
        b = db.query(Blog).filter(Blog.id == blog_id).first()
        return _blog_to_dict(b)
    finally:
        db.close()

def update_blog_status(blog_id, status):
    db = _session()
    try:
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if blog:
            blog.status = status
            db.commit()
            db.refresh(blog)
            return _blog_to_dict(blog)
        return None
    finally:
        db.close()

def update_blog(blog_id, title=None, content=None, tags=None):
    db = _session()
    try:
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if blog:
            if title is not None: blog.title = title
            if content is not None: blog.content = content
            if tags is not None: blog.tags = tags
            db.commit()
            db.refresh(blog)
            return _blog_to_dict(blog)
        return None
    finally:
        db.close()

def delete_blog(blog_id):
    db = _session()
    try:
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if blog:
            db.delete(blog)
            db.commit()
            return _blog_to_dict(blog)
        return None
    finally:
        db.close()


def _profile_to_dict(p):
    if p is None:
        return None
    return {
        "id": p.id, "firebase_uid": p.firebase_uid,
        "username": p.username, "display_name": p.display_name,
        "bio": p.bio, "avatar_url": p.avatar_url,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }

def get_profile_by_uid(firebase_uid: str):
    db = _session()
    try:
        p = db.query(UserProfile).filter(
            UserProfile.firebase_uid == firebase_uid
        ).first()
        return _profile_to_dict(p)
    finally:
        db.close()

def get_profile_by_username(username: str):
    db = _session()
    try:
        p = db.query(UserProfile).filter(
            UserProfile.username == username
        ).first()
        return _profile_to_dict(p)
    finally:
        db.close()

def create_profile(firebase_uid, username, display_name=None, bio=None, avatar_url=None):
    username = (username or "").strip().lower()
    if not username:
        raise ValueError("username is required")
    display_name = (display_name or "").strip() or None
    bio = (bio or "").strip() or None
    db = _session()
    try:
        profile = UserProfile(
            firebase_uid=firebase_uid, username=username,
            display_name=display_name, bio=bio, avatar_url=avatar_url
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return _profile_to_dict(profile)
    finally:
        db.close()

def update_profile(firebase_uid, username=None, display_name=None, bio=None, avatar_url=None):
    db = _session()
    try:
        profile = db.query(UserProfile).filter(
            UserProfile.firebase_uid == firebase_uid
        ).first()
        if profile:
            if username is not None: profile.username = username
            if display_name is not None: profile.display_name = display_name
            if bio is not None: profile.bio = bio
            if avatar_url is not None: profile.avatar_url = avatar_url
            db.commit()
            db.refresh(profile)
            return _profile_to_dict(profile)
        return None
    finally:
        db.close()

def is_username_taken(username: str, exclude_uid: str = None):
    db = _session()
    try:
        query = db.query(UserProfile).filter(UserProfile.username == username)
        if exclude_uid:
            query = query.filter(UserProfile.firebase_uid != exclude_uid)
        return query.first() is not None
    finally:
        db.close()


def toggle_like(blog_id: int, user_id: str):
    db = _session()
    try:
        existing = db.query(Like).filter(
            Like.blog_id == blog_id,
            Like.user_id == user_id
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            return False
        like = Like(blog_id=blog_id, user_id=user_id)
        db.add(like)
        db.commit()
        return True
    finally:
        db.close()

def toggle_like_and_notify(blog_id: int, user_id: str, notify_user_id: str, message: str, link: str = None):
    db = _session()
    try:
        existing = db.query(Like).filter(
            Like.blog_id == blog_id,
            Like.user_id == user_id
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            return False
        like = Like(blog_id=blog_id, user_id=user_id)
        db.add(like)
        if user_id != notify_user_id:
            notif = Notification(user_id=notify_user_id, type="like", message=message, link=link)
            db.add(notif)
        db.commit()
        return True
    finally:
        db.close()

def get_like_count(blog_id: int):
    db = _session()
    try:
        return db.query(Like).filter(Like.blog_id == blog_id).count()
    finally:
        db.close()

def has_liked(blog_id: int, user_id: str):
    db = _session()
    try:
        return db.query(Like).filter(
            Like.blog_id == blog_id,
            Like.user_id == user_id
        ).first() is not None
    finally:
        db.close()


def _comment_to_dict(c):
    if c is None:
        return None
    return {
        "id": c.id, "blog_id": c.blog_id, "user_id": c.user_id,
        "content": c.content,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }

def create_comment(blog_id: int, user_id: str, content: str):
    db = _session()
    try:
        comment = Comment(blog_id=blog_id, user_id=user_id, content=content)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return _comment_to_dict(comment)
    finally:
        db.close()

def create_comment_and_notify(blog_id: int, user_id: str, content: str, notify_user_id: str, message: str, link: str = None):
    db = _session()
    try:
        comment = Comment(blog_id=blog_id, user_id=user_id, content=content)
        db.add(comment)
        if user_id != notify_user_id:
            notif = Notification(user_id=notify_user_id, type="comment", message=message, link=link)
            db.add(notif)
        db.commit()
        db.refresh(comment)
        return _comment_to_dict(comment)
    finally:
        db.close()

def get_comments(blog_id: int):
    db = _session()
    try:
        comments = db.query(Comment).filter(
            Comment.blog_id == blog_id
        ).order_by(Comment.created_at.asc()).all()
        return [_comment_to_dict(c) for c in comments]
    finally:
        db.close()

def delete_comment(comment_id: int, user_id: str):
    db = _session()
    try:
        comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.user_id == user_id
        ).first()
        if comment:
            db.delete(comment)
            db.commit()
            return True
        return False
    finally:
        db.close()


def toggle_follow(follower_uid: str, following_uid: str):
    if follower_uid == following_uid:
        raise ValueError("cannot follow yourself")
    db = _session()
    try:
        existing = db.query(Follow).filter(
            Follow.follower_uid == follower_uid,
            Follow.following_uid == following_uid
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            return False
        follow = Follow(follower_uid=follower_uid, following_uid=following_uid)
        db.add(follow)
        db.commit()
        return True
    finally:
        db.close()

def toggle_follow_and_notify(follower_uid: str, following_uid: str, message: str, link: str = None):
    if follower_uid == following_uid:
        raise ValueError("cannot follow yourself")
    db = _session()
    try:
        existing = db.query(Follow).filter(
            Follow.follower_uid == follower_uid,
            Follow.following_uid == following_uid
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            return False
        follow = Follow(follower_uid=follower_uid, following_uid=following_uid)
        db.add(follow)
        notif = Notification(user_id=following_uid, type="follow", message=message, link=link)
        db.add(notif)
        db.commit()
        return True
    finally:
        db.close()

def is_following(follower_uid: str, following_uid: str):
    db = _session()
    try:
        return db.query(Follow).filter(
            Follow.follower_uid == follower_uid,
            Follow.following_uid == following_uid
        ).first() is not None
    finally:
        db.close()

def get_followers(uid: str):
    db = _session()
    try:
        follows = db.query(Follow).filter(Follow.following_uid == uid).all()
        return [f.follower_uid for f in follows]
    finally:
        db.close()

def get_following(uid: str):
    db = _session()
    try:
        follows = db.query(Follow).filter(Follow.follower_uid == uid).all()
        return [f.following_uid for f in follows]
    finally:
        db.close()

def get_follower_count(uid: str):
    db = _session()
    try:
        return db.query(Follow).filter(Follow.following_uid == uid).count()
    finally:
        db.close()

def get_following_count(uid: str):
    db = _session()
    try:
        return db.query(Follow).filter(Follow.follower_uid == uid).count()
    finally:
        db.close()


def _notification_to_dict(n):
    if n is None:
        return None
    return {
        "id": n.id, "user_id": n.user_id, "type": n.type,
        "message": n.message, "link": n.link, "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }

def create_notification(user_id: str, type: str, message: str, link: str = None):
    db = _session()
    try:
        notif = Notification(user_id=user_id, type=type, message=message, link=link)
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return _notification_to_dict(notif)
    finally:
        db.close()

def get_notifications(user_id: str, skip=0, limit=20):
    db = _session()
    try:
        notifs = db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        return [_notification_to_dict(n) for n in notifs]
    finally:
        db.close()

def get_notifications_count(user_id: str):
    db = _session()
    try:
        return db.query(Notification).filter(Notification.user_id == user_id).count()
    finally:
        db.close()

def mark_all_read(user_id: str):
    db = _session()
    try:
        db.query(Notification).filter(
            Notification.user_id == user_id
        ).update({"is_read": "true"})
        db.commit()
    finally:
        db.close()

def get_unread_count(user_id: str):
    db = _session()
    try:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == "false"
        ).count()
    finally:
        db.close()

def update_cover_image(blog_id: int, user_id: str, cover_image: str):
    db = _session()
    try:
        blog = db.query(Blog).filter(
            Blog.id == blog_id,
            Blog.user_id == user_id
        ).first()
        if blog:
            blog.cover_image = cover_image
            db.commit()
            db.refresh(blog)
            return _blog_to_dict(blog)
        return None
    finally:
        db.close()

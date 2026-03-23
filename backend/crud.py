from database import SessionLocal
from models import Blog, UserProfile, Like, Comment, Follow, Notification


# ─── BLOG CRUD ───────────────────────────────────────────

def create_blog(title, content, tags, user_id, status="published"):
    db = SessionLocal()
    blog = Blog(title=title, content=content, tags=tags, user_id=user_id, status=status)
    db.add(blog)
    db.commit()
    db.refresh(blog)
    db.close()
    return blog

def get_user_blogs(user_id, status="published"):
    db = SessionLocal()
    blogs = db.query(Blog).filter(
        Blog.user_id == user_id,
        Blog.status == status
    ).order_by(Blog.created_at.desc()).all()
    db.close()
    return blogs

def get_all_blogs():
    db = SessionLocal()
    blogs = db.query(Blog).filter(
        Blog.status == "published"
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


# ─── USER PROFILE CRUD ───────────────────────────────────

def get_profile_by_uid(firebase_uid: str):
    db = SessionLocal()
    profile = db.query(UserProfile).filter(
        UserProfile.firebase_uid == firebase_uid
    ).first()
    db.close()
    return profile

def get_profile_by_username(username: str):
    db = SessionLocal()
    profile = db.query(UserProfile).filter(
        UserProfile.username == username
    ).first()
    db.close()
    return profile

def create_profile(firebase_uid, username, display_name=None, bio=None, avatar_url=None):
    db = SessionLocal()
    profile = UserProfile(
        firebase_uid=firebase_uid, username=username,
        display_name=display_name, bio=bio, avatar_url=avatar_url
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.close()
    return profile

def update_profile(firebase_uid, username=None, display_name=None, bio=None, avatar_url=None):
    db = SessionLocal()
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
    db.close()
    return profile

def is_username_taken(username: str, exclude_uid: str = None):
    db = SessionLocal()
    query = db.query(UserProfile).filter(UserProfile.username == username)
    if exclude_uid:
        query = query.filter(UserProfile.firebase_uid != exclude_uid)
    exists = query.first() is not None
    db.close()
    return exists


# ─── LIKES ───────────────────────────────────────────────

def toggle_like(blog_id: int, user_id: str):
    db = SessionLocal()
    existing = db.query(Like).filter(
        Like.blog_id == blog_id,
        Like.user_id == user_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        db.close()
        return False  # unliked
    else:
        like = Like(blog_id=blog_id, user_id=user_id)
        db.add(like)
        db.commit()
        db.close()
        return True  # liked

def get_like_count(blog_id: int):
    db = SessionLocal()
    count = db.query(Like).filter(Like.blog_id == blog_id).count()
    db.close()
    return count

def has_liked(blog_id: int, user_id: str):
    db = SessionLocal()
    exists = db.query(Like).filter(
        Like.blog_id == blog_id,
        Like.user_id == user_id
    ).first() is not None
    db.close()
    return exists


# ─── COMMENTS ────────────────────────────────────────────

def create_comment(blog_id: int, user_id: str, content: str):
    db = SessionLocal()
    comment = Comment(blog_id=blog_id, user_id=user_id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    db.close()
    return comment

def get_comments(blog_id: int):
    db = SessionLocal()
    comments = db.query(Comment).filter(
        Comment.blog_id == blog_id
    ).order_by(Comment.created_at.asc()).all()
    db.close()
    return comments

def delete_comment(comment_id: int, user_id: str):
    db = SessionLocal()
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == user_id
    ).first()
    if comment:
        db.delete(comment)
        db.commit()
        db.close()
        return True
    db.close()
    return False


# ─── FOLLOWS ─────────────────────────────────────────────

def toggle_follow(follower_uid: str, following_uid: str):
    db = SessionLocal()
    existing = db.query(Follow).filter(
        Follow.follower_uid == follower_uid,
        Follow.following_uid == following_uid
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        db.close()
        return False  # unfollowed
    else:
        follow = Follow(follower_uid=follower_uid, following_uid=following_uid)
        db.add(follow)
        db.commit()
        db.close()
        return True  # followed

def is_following(follower_uid: str, following_uid: str):
    db = SessionLocal()
    exists = db.query(Follow).filter(
        Follow.follower_uid == follower_uid,
        Follow.following_uid == following_uid
    ).first() is not None
    db.close()
    return exists

def get_followers(uid: str):
    db = SessionLocal()
    follows = db.query(Follow).filter(Follow.following_uid == uid).all()
    db.close()
    return [f.follower_uid for f in follows]

def get_following(uid: str):
    db = SessionLocal()
    follows = db.query(Follow).filter(Follow.follower_uid == uid).all()
    db.close()
    return [f.following_uid for f in follows]

def get_follower_count(uid: str):
    db = SessionLocal()
    count = db.query(Follow).filter(Follow.following_uid == uid).count()
    db.close()
    return count

def get_following_count(uid: str):
    db = SessionLocal()
    count = db.query(Follow).filter(Follow.follower_uid == uid).count()
    db.close()
    return count


# ─── NOTIFICATIONS ────────────────────────────────────────

def create_notification(user_id: str, type: str, message: str, link: str = None):
    db = SessionLocal()
    notif = Notification(user_id=user_id, type=type, message=message, link=link)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    db.close()
    return notif

def get_notifications(user_id: str):
    db = SessionLocal()
    notifs = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    db.close()
    return notifs

def mark_all_read(user_id: str):
    db = SessionLocal()
    db.query(Notification).filter(
        Notification.user_id == user_id
    ).update({"is_read": "true"})
    db.commit()
    db.close()

def get_unread_count(user_id: str):
    db = SessionLocal()
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == "false"
    ).count()
    db.close()
    return count

def update_cover_image(blog_id: int, user_id: str, cover_image: str):
    db = SessionLocal()
    blog = db.query(Blog).filter(
        Blog.id == blog_id,
        Blog.user_id == user_id  # ✅ only owner can update
    ).first()
    if blog:
        blog.cover_image = cover_image
        db.commit()
        db.refresh(blog)
    db.close()
    return blog
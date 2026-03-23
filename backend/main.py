from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from engine import BlogEngine
from firebase_auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
from crud import (
    get_profile_by_uid, get_profile_by_username,
    create_profile, update_profile, is_username_taken,
    get_user_blogs, toggle_like, get_like_count, has_liked,
    create_comment, get_comments, delete_comment,
    toggle_follow, is_following, get_follower_count,
    get_following_count, get_following,
    create_notification, get_notifications,
    mark_all_read, get_unread_count,
    update_cover_image
)
from database import engine as db_engine  
from models import Base

app = FastAPI()
engine = BlogEngine()  

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ai-blog-platform-eohe.vercel.app",
    "https://ai-blog-platform-eohe.vercel.app/",
    "https://ai-blog-platform-eohe-8uqjodomm-monojit-das-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper ──────────────────────────────────────────────
def attach_author(blog_dict: dict, firebase_uid: str) -> dict:
    profile = get_profile_by_uid(firebase_uid)
    if profile:
        blog_dict["author"] = {
            "username": profile.username,
            "display_name": profile.display_name,
            "avatar_url": profile.avatar_url,
        }
    else:
        blog_dict["author"] = None
    return blog_dict


# ─── Pydantic models ─────────────────────────────────────
class SuggestRequest(BaseModel):
    text: str

class TagRequest(BaseModel):
    text: str

class SEORequest(BaseModel):
    title: str
    content: str

class SummarizeRequest(BaseModel):
    title: str
    content: str

class ManualBlogRequest(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class DraftRequest(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class ProfileCreateRequest(BaseModel):
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class CommentRequest(BaseModel):
    content: str


# ─── Routes ──────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "AI Blog API running"}

# ── Blogs ──

@app.get("/blogs")
def list_blogs():
    blogs = engine.list_blogs()
    return [attach_author(b, b["user_id"]) for b in blogs]

@app.get("/blogs/search")
def search_blogs(q: str):
    blogs = engine.list_blogs() if not q or not q.strip() else engine.search_blogs(q.strip())
    return [attach_author(b, b["user_id"]) for b in blogs]

@app.get("/users/me/blogs")
def my_blogs(user=Depends(get_current_user)):
    blogs = engine.user_blogs(user)
    return [attach_author(b, b["user_id"]) for b in blogs]

@app.get("/users/me/drafts")
def my_drafts(user=Depends(get_current_user)):
    drafts = engine.get_drafts(user)
    return [attach_author(b, b["user_id"]) for b in drafts]

@app.post("/blogs/generate")
def generate_blog(topic: str, user=Depends(get_current_user)):
    result = engine.ask(topic, user)
    return attach_author(result, result.get("user_id", user))

@app.post("/blogs/manual")
def create_manual_blog(req: ManualBlogRequest, user=Depends(get_current_user)):
    from crud import create_blog
    blog = create_blog(
        title=req.title, content=req.content,
        tags=",".join(req.tags), user_id=user, status="published"
    )
    result = {
        "id": blog.id, "title": blog.title, "content": blog.content,
        "tags": blog.tags, "status": blog.status, "user_id": blog.user_id
    }
    return attach_author(result, user)

@app.post("/blogs/draft")
def save_draft(req: DraftRequest, user=Depends(get_current_user)):
    result = engine.save_draft(req.title, req.content, req.tags, user)
    return attach_author(result, user)

@app.post("/blogs/seo")
def seo_analyze(req: SEORequest, user=Depends(get_current_user)):
    result = engine.seo_analyze(req.title, req.content)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/blogs/summarize")
def summarize_blog(req: SummarizeRequest):
    summary = engine.summarize(req.title, req.content)
    if not summary:
        raise HTTPException(status_code=500, detail="Failed to summarize")
    return {"summary": summary}

@app.post("/blogs/{blog_id}/publish")
def publish_draft(blog_id: int, user=Depends(get_current_user)):
    result = engine.publish_draft(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    # Notify followers
    followers = get_followers_of_blog_author(result.get("user_id", ""))
    for follower_uid in followers:
        create_notification(
            user_id=follower_uid,
            type="new_blog",
            message=f"Someone you follow published a new blog: {result['title']}",
            link=f"/blogs/{result['id']}"
        )
    return attach_author(result, user)

@app.get("/blogs/{blog_id}")
def get_blog(blog_id: int, user: str = None):
    result = engine.get_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    result["like_count"] = get_like_count(blog_id)
    result["comment_count"] = len(get_comments(blog_id))
    return attach_author(result, result.get("user_id", ""))

@app.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int):
    result = engine.delete_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    return result

# ── Likes ──

@app.post("/blogs/{blog_id}/like")
def like_blog(blog_id: int, user=Depends(get_current_user)):
    liked = toggle_like(blog_id, user)
    count = get_like_count(blog_id)

    if liked:
        # notify blog author
        blog = engine.get_blog(blog_id)
        if blog and blog.get("user_id") and blog["user_id"] != user:
            liker_profile = get_profile_by_uid(user)
            name = f"@{liker_profile.username}" if liker_profile else "Someone"
            create_notification(
                user_id=blog["user_id"],
                type="like",
                message=f"{name} liked your blog: {blog['title']}",
                link=f"/blogs/{blog_id}"
            )

    return {"liked": liked, "like_count": count}

@app.get("/blogs/{blog_id}/like")
def get_like_status(blog_id: int, user=Depends(get_current_user)):
    liked = has_liked(blog_id, user)
    count = get_like_count(blog_id)
    return {"liked": liked, "like_count": count}

# ── Comments ──

@app.post("/blogs/{blog_id}/comments")
def add_comment(blog_id: int, req: CommentRequest, user=Depends(get_current_user)):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    comment = create_comment(blog_id, user, req.content.strip())

    # notify blog author
    blog = engine.get_blog(blog_id)
    if blog and blog.get("user_id") and blog["user_id"] != user:
        commenter_profile = get_profile_by_uid(user)
        name = f"@{commenter_profile.username}" if commenter_profile else "Someone"
        create_notification(
            user_id=blog["user_id"],
            type="comment",
            message=f"{name} commented on your blog: {blog['title']}",
            link=f"/blogs/{blog_id}"
        )

    profile = get_profile_by_uid(user)
    return {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
        "author": {
            "username": profile.username if profile else None,
            "display_name": profile.display_name if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
        }
    }

@app.get("/blogs/{blog_id}/comments")
def get_blog_comments(blog_id: int):
    comments = get_comments(blog_id)
    result = []
    for c in comments:
        profile = get_profile_by_uid(c.user_id)
        result.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
            "author": {
                "username": profile.username if profile else None,
                "display_name": profile.display_name if profile else None,
                "avatar_url": profile.avatar_url if profile else None,
            }
        })
    return result

@app.delete("/comments/{comment_id}")
def remove_comment(comment_id: int, user=Depends(get_current_user)):
    deleted = delete_comment(comment_id, user)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found or not yours")
    return {"deleted": True}

# ── Follows ──

@app.post("/users/{uid}/follow")
def follow_user(uid: str, user=Depends(get_current_user)):
    if uid == user:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    followed = toggle_follow(user, uid)
    count = get_follower_count(uid)

    if followed:
        follower_profile = get_profile_by_uid(user)
        name = f"@{follower_profile.username}" if follower_profile else "Someone"
        create_notification(
            user_id=uid,
            type="follow",
            message=f"{name} started following you",
            link=f"/u/{follower_profile.username}" if follower_profile else None
        )

    return {"following": followed, "follower_count": count}

@app.get("/users/{uid}/follow")
def get_follow_status(uid: str, user=Depends(get_current_user)):
    following = is_following(user, uid)
    follower_count = get_follower_count(uid)
    following_count = get_following_count(uid)
    return {
        "following": following,
        "follower_count": follower_count,
        "following_count": following_count
    }

# ── Notifications ──

@app.get("/users/me/notifications")
def my_notifications(user=Depends(get_current_user)):
    notifs = get_notifications(user)
    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

@app.get("/users/me/notifications/unread")
def unread_count(user=Depends(get_current_user)):
    return {"count": get_unread_count(user)}

@app.post("/users/me/notifications/read")
def mark_notifications_read(user=Depends(get_current_user)):
    mark_all_read(user)
    return {"ok": True}

# ── Suggest / Tags ──

@app.post("/suggest")
def suggest(req: SuggestRequest, user=Depends(get_current_user)):
    return {"suggestion": engine.suggest(req.text)}

@app.post("/suggest-tags")
def suggest_tags(req: TagRequest, user=Depends(get_current_user)):
    return {"tags": engine.suggest_tags(req.text)}

# ── User Profiles ──

@app.get("/users/me/profile")
def get_my_profile(user=Depends(get_current_user)):
    profile = get_profile_by_uid(user)
    if not profile:
        return None
    return {
        "username": profile.username,
        "display_name": profile.display_name,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "firebase_uid": profile.firebase_uid
    }

@app.post("/users/me/profile")
def create_my_profile(req: ProfileCreateRequest, user=Depends(get_current_user)):
    if is_username_taken(req.username, exclude_uid=user):
        raise HTTPException(status_code=400, detail="Username already taken")
    existing = get_profile_by_uid(user)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists, use PATCH to update")
    profile = create_profile(
        firebase_uid=user, username=req.username,
        display_name=req.display_name, bio=req.bio, avatar_url=req.avatar_url
    )
    return {
        "username": profile.username, "display_name": profile.display_name,
        "bio": profile.bio, "avatar_url": profile.avatar_url
    }

@app.patch("/users/me/profile")
def update_my_profile(req: ProfileUpdateRequest, user=Depends(get_current_user)):
    if req.username and is_username_taken(req.username, exclude_uid=user):
        raise HTTPException(status_code=400, detail="Username already taken")
    profile = update_profile(
        firebase_uid=user, username=req.username,
        display_name=req.display_name, bio=req.bio, avatar_url=req.avatar_url
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "username": profile.username, "display_name": profile.display_name,
        "bio": profile.bio, "avatar_url": profile.avatar_url
    }

@app.get("/u/{username}")
def get_public_profile(username: str):
    profile = get_profile_by_username(username)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    blogs = get_user_blogs(profile.firebase_uid, status="published")
    follower_count = get_follower_count(profile.firebase_uid)
    following_count = get_following_count(profile.firebase_uid)
    return {
        "username": profile.username,
        "display_name": profile.display_name,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "firebase_uid": profile.firebase_uid,
        "follower_count": follower_count,
        "following_count": following_count,
        "blogs": [
            {
                "id": b.id, "title": b.title, "content": b.content,
                "tags": b.tags, "status": b.status
            }
            for b in blogs
        ]
    }

@app.get("/users/check-username/{username}")
def check_username(username: str):
    return {"available": not is_username_taken(username)}


# ─── Helper for followers ─────────────────────────────────
def get_followers_of_blog_author(uid: str):
    from crud import get_followers
    return get_followers(uid)

from crud import update_cover_image  # add to existing import

class CoverImageRequest(BaseModel):
    cover_image: str

@app.patch("/blogs/{blog_id}/cover")
def update_blog_cover(blog_id: int, req: CoverImageRequest, user=Depends(get_current_user)):
    blog = update_cover_image(blog_id, user, req.cover_image)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found or not authorized")
    return {"cover_image": blog.cover_image}

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=db_engine)  
    print("✅ Database tables created/verified")
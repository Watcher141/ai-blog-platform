import uuid
import os
import shutil
import traceback
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import List, Optional
from engine import BlogEngine
from firebase_auth import get_current_user
from auth import create_user, get_user_by_email, get_user_by_id, create_access_token, verify_password
from cache import get_cache, set_cache, delete_cache, invalidate_pattern
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
from ratelimit import rate_limiter
import validators
from logger import logger, set_request_id
from crud import (
    get_profile_by_uid, get_profile_by_username,
    create_profile, update_profile, is_username_taken,
    get_user_blogs, toggle_like, toggle_like_and_notify,
    get_like_count, has_liked,
    create_comment, create_comment_and_notify,
    get_comments, delete_comment,
    toggle_follow, toggle_follow_and_notify,
    is_following, get_follower_count,
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
    "https://ai-blog-platform-eohe-8uqjodomm-monojit-das-projects.vercel.app",
    "https://ai-blog-platform-green.vercel.app",
    "https://ai-blog-backend-ytfj.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request ID Middleware ────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID", "")
        if not rid:
            rid = set_request_id()
        else:
            set_request_id(rid)
        logger.info("%s %s", request.method, request.url.path)
        start = time.time()
        response = await call_next(request)
        elapsed = time.time() - start
        logger.info("%s %s -> %s (%.3fs)", request.method, request.url.path, response.status_code, elapsed)
        response.headers["X-Request-ID"] = rid
        response.headers["X-Response-Time-Ms"] = str(round(elapsed * 1000))
        return response

app.add_middleware(RequestIDMiddleware)


# ─── Rate Limiter Middleware ─────────────────────────────
RATE_LIMITS = {
    "/auth/": (5, 60),
    "/blogs/generate": (30, 60),
    "/upload": (10, 60),
}

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        for prefix, (max_req, window) in RATE_LIMITS.items():
            if request.url.path.startswith(prefix):
                client_ip = request.client.host if request.client else "unknown"
                key = f"{client_ip}:{request.url.path}"
                if not rate_limiter.check(key, max_req, window):
                    remaining = rate_limiter.get_remaining(key, max_req, window)
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Please slow down."},
                        headers={"X-RateLimit-Remaining": str(remaining)},
                    )
                break
        return await call_next(request)

app.add_middleware(RateLimitMiddleware)


# ─── Global Exception Handlers ───────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    detail = errors[0]["msg"] if errors else "Validation error"
    logger.warning("Validation error: %s", detail)
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTP %s: %s", exc.status_code, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("Validation error: %s", exc)
    return JSONResponse(status_code=400, content={"detail": str(exc)})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ─── Helper ──────────────────────────────────────────────
def attach_author(blog_dict: dict, firebase_uid: str) -> dict:
    profile = get_profile_by_uid(firebase_uid)
    if profile:
        blog_dict["author"] = {
            "username": profile["username"],
            "display_name": profile["display_name"],
            "avatar_url": profile["avatar_url"],
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

class CoverImageRequest(BaseModel):
    cover_image: str

class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class AuthFirebaseRequest(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None


# ─── Routes ──────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "AI Blog API running"}



@app.get("/health")
def health_check():
    try:
        db_engine.connect()
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "timestamp": time.time(),
        "db": db_status
    }

# ── Auth ──

@app.post("/auth/register")
def auth_register(req: AuthRegisterRequest):
    email_err = validators.validate_email(req.email)
    if email_err:
        raise HTTPException(status_code=400, detail=email_err)
    pw_err = validators.validate_password(req.password)
    if pw_err:
        raise HTTPException(status_code=400, detail=pw_err)
    if get_user_by_email(req.email.strip().lower()):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(email=req.email, password=req.password, display_name=req.display_name)
    token = create_access_token(user.id)
    return {
        "user": {"id": user.id, "email": user.email, "displayName": user.display_name},
        "token": token,
    }

@app.post("/auth/login")
def auth_login(req: AuthLoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return {
        "user": {"id": user.id, "email": user.email, "displayName": user.display_name},
        "token": token,
    }

@app.get("/auth/me")
def auth_me(user=Depends(get_current_user)):
    u = get_user_by_id(user)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": u.id, "email": u.email, "displayName": u.display_name}

@app.post("/auth/register-firebase")
def auth_register_firebase(req: AuthFirebaseRequest):
    existing = get_user_by_email(req.email.strip().lower())
    if existing:
        return {
            "user": {"id": existing.id, "email": existing.email, "displayName": existing.display_name},
            "token": "",
        }
    import uuid as _uuid
    from auth import create_user as auth_create_user
    db_user = auth_create_user(
        email=req.email,
        password=_uuid.uuid4().hex + "Aa1",
        display_name=req.display_name,
    )
    return {
        "user": {"id": db_user.id, "email": db_user.email, "displayName": db_user.display_name},
        "token": "",
    }

# ── Upload ──

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    content_type = file.content_type or ""
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    upload_err = validators.validate_upload(content_type, file_size, file.filename or "")
    if upload_err:
        raise HTTPException(status_code=400, detail=upload_err)
    safe_name = f"{uuid.uuid4()}{Path(file.filename).suffix.lower() if file.filename else '.bin'}"
    path = UPLOAD_DIR / safe_name
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/uploads/{safe_name}"
    return {"url": url}

# ── Blogs ──

@app.get("/blogs")
def list_blogs(skip: int = 0, limit: int = 20):
    cache_key = f"blogs_list:{skip}:{limit}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    blogs = engine.list_blogs(skip=skip, limit=limit)
    from crud import get_all_blogs_count
    total = get_all_blogs_count()
    result = {
        "items": [attach_author(b, b["user_id"]) for b in blogs],
        "total": total, "skip": skip, "limit": limit,
    }
    set_cache(cache_key, result, 120)
    return result

@app.get("/blogs/search")
def search_blogs(q: str, skip: int = 0, limit: int = 20):
    cache_key = f"search:{q.strip()}:{skip}:{limit}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    blogs = engine.list_blogs(skip=0, limit=10000) if not q or not q.strip() else engine.search_blogs(q.strip(), skip=skip, limit=limit)
    from crud import get_all_blogs_count
    total = get_all_blogs_count()
    result = {
        "items": [attach_author(b, b["user_id"]) for b in blogs],
        "total": total, "skip": skip, "limit": limit,
    }
    set_cache(cache_key, result, 60)
    return result

@app.get("/users/me/blogs")
def my_blogs(user=Depends(get_current_user), skip: int = 0, limit: int = 20):
    blogs = engine.user_blogs(user, skip=skip, limit=limit)
    from crud import get_user_blogs_count
    total = get_user_blogs_count(user, status="published")
    return {
        "items": [attach_author(b, b["user_id"]) for b in blogs],
        "total": total, "skip": skip, "limit": limit,
    }

@app.get("/users/me/drafts")
def my_drafts(user=Depends(get_current_user), skip: int = 0, limit: int = 20):
    drafts = engine.get_drafts(user, skip=skip, limit=limit)
    from crud import get_user_blogs_count
    total = get_user_blogs_count(user, status="draft")
    return {
        "items": [attach_author(b, b["user_id"]) for b in drafts],
        "total": total, "skip": skip, "limit": limit,
    }

@app.post("/blogs/generate")
def generate_blog(topic: str, user=Depends(get_current_user)):
    result = engine.ask(topic, user)
    invalidate_pattern("blogs_list:*")
    invalidate_pattern("search:*")
    return attach_author(result, result.get("user_id", user))

@app.post("/blogs/manual")
def create_manual_blog(req: ManualBlogRequest, user=Depends(get_current_user)):
    from crud import create_blog
    blog = create_blog(
        title=req.title, content=req.content,
        tags=",".join(req.tags), user_id=user, status="published"
    )
    invalidate_pattern("blogs_list:*")
    invalidate_pattern("search:*")
    return attach_author(blog, user)

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
    delete_cache(f"blog_detail:{blog_id}")
    invalidate_pattern("blogs_list:*")
    invalidate_pattern("search:*")
    followers = get_followers_of_blog_author(result.get("user_id", ""))
    for follower_uid in followers:
        create_notification(
            user_id=follower_uid,
            type="new_blog",
            message=f"Someone you follow published a new blog: {result['title']}",
            link=f"/blogs/{result['id']}"
        )
        _send_push_to_user(follower_uid, "New Blog", f"Someone you follow published: {result['title']}")
    return attach_author(result, user)

@app.get("/blogs/{blog_id}")
def get_blog(blog_id: int):
    cache_key = f"blog_detail:{blog_id}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    result = engine.get_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    result["like_count"] = get_like_count(blog_id)
    result["comment_count"] = len(get_comments(blog_id))
    result = attach_author(result, result.get("user_id", ""))
    set_cache(cache_key, result, 300)
    return result

@app.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int):
    result = engine.delete_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    delete_cache(f"blog_detail:{blog_id}")
    invalidate_pattern("blogs_list:*")
    invalidate_pattern("search:*")
    return result

@app.patch("/blogs/{blog_id}/cover")
def update_blog_cover(blog_id: int, req: CoverImageRequest, user=Depends(get_current_user)):
    blog = update_cover_image(blog_id, user, req.cover_image)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found or not authorized")
    delete_cache(f"blog_detail:{blog_id}")
    return {"cover_image": blog["cover_image"]}

# ── Likes ──

@app.post("/blogs/{blog_id}/like")
def like_blog(blog_id: int, user=Depends(get_current_user)):
    blog = engine.get_blog(blog_id)
    blog_author = blog.get("user_id") if blog else None
    if blog_author and blog_author != user:
        liker_profile = get_profile_by_uid(user)
        name = f"@{liker_profile['username']}" if liker_profile else "Someone"
        liked = toggle_like_and_notify(
            blog_id, user, blog_author,
            f"{name} liked your blog: {blog['title']}",
            f"/blogs/{blog_id}"
        )
        _send_push_to_user(blog_author, "New Like", f"{name} liked your blog: {blog['title']}")
    else:
        liked = toggle_like(blog_id, user)
    count = get_like_count(blog_id)
    delete_cache(f"blog_detail:{blog_id}")
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
    blog = engine.get_blog(blog_id)
    blog_author = blog.get("user_id") if blog else None
    if blog_author and blog_author != user:
        commenter_profile = get_profile_by_uid(user)
        name = f"@{commenter_profile['username']}" if commenter_profile else "Someone"
        comment = create_comment_and_notify(
            blog_id, user, req.content.strip(),
            blog_author,
            f"{name} commented on your blog: {blog['title']}",
            f"/blogs/{blog_id}"
        )
        _send_push_to_user(blog_author, "New Comment", f"{name} commented on your blog: {blog['title']}")
    else:
        comment = create_comment(blog_id, user, req.content.strip())
    profile = get_profile_by_uid(user)
    delete_cache(f"blog_detail:{blog_id}")
    return {
        "id": comment["id"],
        "content": comment["content"],
        "created_at": comment["created_at"],
        "author": {
            "username": profile["username"] if profile else None,
            "display_name": profile["display_name"] if profile else None,
            "avatar_url": profile["avatar_url"] if profile else None,
        }
    }

@app.get("/blogs/{blog_id}/comments")
def get_blog_comments(blog_id: int):
    cache_key = f"comments:{blog_id}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    comments = get_comments(blog_id)
    result = []
    for c in comments:
        profile = get_profile_by_uid(c["user_id"])
        result.append({
            "id": c["id"],
            "content": c["content"],
            "created_at": c["created_at"],
            "author": {
                "username": profile["username"] if profile else None,
                "display_name": profile["display_name"] if profile else None,
                "avatar_url": profile["avatar_url"] if profile else None,
            }
        })
    set_cache(cache_key, result, 120)
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
    follower_profile = get_profile_by_uid(user)
    name = f"@{follower_profile['username']}" if follower_profile else "Someone"
    link = f"/u/{follower_profile['username']}" if follower_profile else None
    followed = toggle_follow_and_notify(
        user, uid,
        f"{name} started following you",
        link
    )
    count = get_follower_count(uid)
    invalidate_pattern("profile:*")
    _send_push_to_user(uid, "New Follower", f"{name} started following you")
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

# ── FCM Device Tokens ──
_device_tokens: dict[str, set[str]] = {}

class DeviceTokenRequest(BaseModel):
    token: str

@app.post("/users/me/device-token")
def register_device_token(req: DeviceTokenRequest, user=Depends(get_current_user)):
    if user not in _device_tokens:
        _device_tokens[user] = set()
    _device_tokens[user].add(req.token)
    logger.info("Device token registered for user %s", user)
    return {"ok": True}

def _send_push_to_user(uid: str, title: str, body: str, data: dict | None = None):
    tokens = _device_tokens.get(uid)
    if not tokens:
        return
    from fcm import send_push_to_multiple, is_fcm_available
    if is_fcm_available():
        send_push_to_multiple(list(tokens), title, body, data)
    else:
        logger.info("[FCM fallback] User %s: title=%s body=%s", uid, title, body)


# ── Notifications ──

@app.get("/users/me/notifications")
def my_notifications(user=Depends(get_current_user), skip: int = 0, limit: int = 20):
    notifs = get_notifications(user, skip=skip, limit=limit)
    from crud import get_notifications_count
    total = get_notifications_count(user)
    return {
        "items": [
            {
                "id": n["id"], "type": n["type"], "message": n["message"],
                "link": n["link"], "is_read": n["is_read"],
                "created_at": n["created_at"]
            }
            for n in notifs
        ],
        "total": total, "skip": skip, "limit": limit,
    }

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
        "username": profile["username"],
        "display_name": profile["display_name"],
        "bio": profile["bio"],
        "avatar_url": profile["avatar_url"],
        "firebase_uid": profile["firebase_uid"]
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
    invalidate_pattern(f"profile:{profile['username']}:*")
    return {
        "username": profile["username"], "display_name": profile["display_name"],
        "bio": profile["bio"], "avatar_url": profile["avatar_url"]
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
    invalidate_pattern("profile:*")
    return {
        "username": profile["username"], "display_name": profile["display_name"],
        "bio": profile["bio"], "avatar_url": profile["avatar_url"]
    }

@app.get("/u/{username}")
def get_public_profile(username: str, skip: int = 0, limit: int = 20):
    cache_key = f"profile:{username}:{skip}:{limit}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    profile = get_profile_by_username(username)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    blogs = get_user_blogs(profile["firebase_uid"], status="published", skip=skip, limit=limit)
    from crud import get_user_blogs_count
    total_blogs = get_user_blogs_count(profile["firebase_uid"], status="published")
    follower_count = get_follower_count(profile["firebase_uid"])
    following_count = get_following_count(profile["firebase_uid"])
    result = {
        "username": profile["username"],
        "display_name": profile["display_name"],
        "bio": profile["bio"],
        "avatar_url": profile["avatar_url"],
        "firebase_uid": profile["firebase_uid"],
        "follower_count": follower_count,
        "following_count": following_count,
        "blogs": blogs,
        "total_blogs": total_blogs,
    }
    set_cache(cache_key, result, 120)
    return result

@app.get("/users/check-username/{username}")
def check_username(username: str):
    return {"available": not is_username_taken(username)}


# ─── Helper for followers ─────────────────────────────────
def get_followers_of_blog_author(uid: str):
    from crud import get_followers
    return get_followers(uid)


# Mount uploads statically at module level
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=db_engine)
    logger.info("Database tables created/verified")
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from engine import BlogEngine
from firebase_auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
engine = BlogEngine()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ai-blog-platform-pi.vercel.app",  # ← add this
    "https://ai-blog-platform-pi.vercel.app/",  # ← with trailing slash too
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/")
def root():
    return {"message": "AI Blog API running"}

@app.get("/blogs")
def list_blogs():
    return engine.list_blogs()

@app.get("/blogs/search")
def search_blogs(q: str):
    if not q or not q.strip():
        return engine.list_blogs()
    return engine.search_blogs(q.strip())

@app.get("/users/me/blogs")
def my_blogs(user=Depends(get_current_user)):
    return engine.user_blogs(user)

@app.get("/users/me/drafts")
def my_drafts(user=Depends(get_current_user)):
    return engine.get_drafts(user)

@app.post("/blogs/generate")
def generate_blog(topic: str, user=Depends(get_current_user)):
    return engine.ask(topic, user)

@app.post("/blogs/manual")
def create_manual_blog(req: ManualBlogRequest, user=Depends(get_current_user)):
    from crud import create_blog
    blog = create_blog(
        title=req.title,
        content=req.content,
        tags=",".join(req.tags),
        user_id=user,
        status="published"
    )
    return {
        "id": blog.id,
        "title": blog.title,
        "content": blog.content,
        "tags": blog.tags,
        "status": blog.status
    }

@app.post("/blogs/draft")
def save_draft(req: DraftRequest, user=Depends(get_current_user)):
    return engine.save_draft(req.title, req.content, req.tags, user)

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
    return result

@app.get("/blogs/{blog_id}")
def get_blog(blog_id: int):
    result = engine.get_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    return result

@app.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int):
    result = engine.delete_blog(blog_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Blog not found")
    return result

@app.post("/suggest")
def suggest(req: SuggestRequest, user=Depends(get_current_user)):
    suggestion = engine.suggest(req.text)
    return {"suggestion": suggestion}

@app.post("/suggest-tags")
def suggest_tags(req: TagRequest, user=Depends(get_current_user)):
    tags = engine.suggest_tags(req.text)
    return {"tags": tags}
from structured_blog_chain import chain
from cache import get_cache, set_cache
from crud import get_all_blogs, get_blog, delete_blog
from crud import get_user_blogs, create_blog, update_blog_status, update_blog
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
import re
import json

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)

suggest_prompt = PromptTemplate.from_template("""
You are a blog writing assistant. The user is writing a blog post.
Continue the text below with ONE natural next sentence only.
Do not repeat what was already written.
Do not add explanations or extra content.
Return ONLY the next sentence, nothing else.

Current text:
{text}

Next sentence:
""")

tag_prompt = PromptTemplate.from_template("""
Read the blog content below and generate 4-6 relevant short tags.
Return ONLY a JSON array of strings, nothing else.
Example: ["technology", "AI", "future", "machine learning"]

Content:
{text}
""")

seo_prompt = PromptTemplate.from_template("""
You are an SEO expert. Analyze the blog post below and return a detailed SEO report.

Title: {title}
Content: {content}

Return ONLY valid JSON in this exact format:
{{
  "score": 78,
  "meta_description": "A compelling 155-character meta description for this blog",
  "focus_keywords": ["keyword1", "keyword2", "keyword3"],
  "readability": "Good",
  "word_count": 450,
  "tips": [
    "Add more internal links",
    "Include the focus keyword in the first paragraph",
    "Add alt text to images"
  ]
}}

Rules:
- score must be a number between 0 and 100
- meta_description must be under 160 characters
- focus_keywords must be 3-5 strings
- readability must be one of: "Poor", "Fair", "Good", "Excellent"
- tips must be 3-5 actionable strings
- word_count must be the actual word count of the content
- DO NOT wrap in markdown
- DO NOT add explanation
""")

summarize_prompt = PromptTemplate.from_template("""
You are a blog summarizer. Read the blog below and write a concise TLDR summary.

Title: {title}
Content: {content}

Rules:
- Write 2-3 sentences maximum
- Capture the key points and main takeaway
- Write in plain English, no jargon
- Do NOT start with "TLDR:" or "Summary:"
- Return ONLY the summary text, nothing else
""")


class BlogEngine:

    def ask(self, topic: str, user_id: str):
        cache_key = f"{user_id}:{topic}"
        cached = get_cache(cache_key)
        if cached:
            print("CACHE HIT")
            return cached

        print("CACHE MISS")
        result = chain.invoke({"topic": topic})

        blog = create_blog(
            title=result["title"],
            content=result["content"],
            tags=",".join(result["tags"]),
            user_id=user_id,
            status="draft"
        )

        response = {
            "id": blog.id,
            "title": blog.title,
            "content": blog.content,
            "tags": blog.tags,
            "status": blog.status,
            "user_id": blog.user_id,
            "cover_image": blog.cover_image  # ✅
        }

        set_cache(cache_key, response)
        return response

    def suggest(self, text: str) -> str:
        try:
            context = text[-500:] if len(text) > 500 else text
            response = llm.invoke(suggest_prompt.format(text=context))
            return response.content.strip()
        except Exception as e:
            print(f"Suggest error: {e}")
            return ""

    def suggest_tags(self, text: str) -> list:
        try:
            context = text[:1000]
            response = llm.invoke(tag_prompt.format(text=context))
            raw = response.content.strip()
            raw = re.sub(r"^```(?:json)?\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
            return json.loads(raw.strip())
        except Exception as e:
            print(f"Tag suggest error: {e}")
            return []

    def seo_analyze(self, title: str, content: str) -> dict:
        try:
            response = llm.invoke(seo_prompt.format(
                title=title, content=content[:2000]
            ))
            raw = response.content.strip()
            raw = re.sub(r"^```(?:json)?\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
            return json.loads(raw.strip())
        except Exception as e:
            print(f"SEO analyze error: {e}")
            return {"error": "Failed to analyze SEO"}

    def summarize(self, title: str, content: str) -> str:
        try:
            response = llm.invoke(summarize_prompt.format(
                title=title, content=content[:3000]
            ))
            return response.content.strip()
        except Exception as e:
            print(f"Summarize error: {e}")
            return ""

    def search_blogs(self, query: str) -> list:
        blogs = get_all_blogs()
        query_lower = query.lower()
        results = []
        for b in blogs:
            if (query_lower in (b.title or "").lower() or
                query_lower in (b.content or "").lower() or
                query_lower in (b.tags or "").lower()):
                results.append({
                    "id": b.id, "title": b.title, "content": b.content,
                    "tags": b.tags, "status": b.status, "user_id": b.user_id,
                    "cover_image": b.cover_image  # ✅
                })
        return results

    def save_draft(self, title: str, content: str, tags: list, user_id: str) -> dict:
        blog = create_blog(
            title=title,
            content=content,
            tags=",".join(tags) if isinstance(tags, list) else tags,
            user_id=user_id,
            status="draft"
        )
        return {
            "id": blog.id, "title": blog.title, "content": blog.content,
            "tags": blog.tags, "status": blog.status, "user_id": blog.user_id,
            "cover_image": blog.cover_image  # ✅
        }

    def publish_draft(self, blog_id: int) -> dict:
        blog = update_blog_status(blog_id, "published")
        if not blog:
            return {"error": "Blog not found"}
        return {
            "id": blog.id, "title": blog.title, "content": blog.content,
            "tags": blog.tags, "status": blog.status, "user_id": blog.user_id,
            "cover_image": blog.cover_image  # ✅
        }

    def get_drafts(self, user_id: str) -> list:
        blogs = get_user_blogs(user_id, status="draft")
        return [
            {
                "id": b.id, "title": b.title, "content": b.content,
                "tags": b.tags, "status": b.status, "user_id": b.user_id,
                "cover_image": b.cover_image  # ✅
            }
            for b in blogs
        ]

    def list_blogs(self):
        blogs = get_all_blogs()
        return [
            {
                "id": b.id, "title": b.title, "content": b.content,
                "tags": b.tags, "status": b.status, "user_id": b.user_id,
                "cover_image": b.cover_image  # ✅
            }
            for b in blogs
        ]

    def get_blog(self, blog_id: int):
        blog = get_blog(blog_id)
        if not blog:
            return {"error": "Blog not found"}
        return {
            "id": blog.id, "title": blog.title, "content": blog.content,
            "tags": blog.tags, "status": blog.status, "user_id": blog.user_id,
            "cover_image": blog.cover_image  # ✅
        }

    def delete_blog(self, blog_id: int):
        blog = delete_blog(blog_id)
        if not blog:
            return {"error": "Blog not found"}
        return {"deleted": True}

    def user_blogs(self, user_id):
        blogs = get_user_blogs(user_id, status="published")
        return [
            {
                "id": b.id, "title": b.title, "content": b.content,
                "tags": b.tags, "status": b.status, "user_id": b.user_id,
                "cover_image": b.cover_image  # ✅
            }
            for b in blogs
        ]
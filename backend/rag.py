import httpx
from bs4 import BeautifulSoup
from ddgs import DDGS


def search_web(topic: str, max_results: int = 5) -> list[dict]:
    """Search DuckDuckGo for topic and return results."""
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(topic, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                })
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
    return results


def fetch_page_text(url: str, timeout: int = 6) -> str:
    """Fetch and extract clean text from a URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = httpx.get(url, timeout=timeout, headers=headers, follow_redirects=True)
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove noise
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)

        # Limit to 800 chars per page to stay within token limits
        return text[:800]
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return ""


def build_rag_context(topic: str) -> str:
    """Search web and build context string for the prompt."""
    print(f"RAG: Searching for '{topic}'...")
    results = search_web(topic, max_results=5)

    if not results:
        print("RAG: No results found, proceeding without context.")
        return ""

    context_parts = []

    for i, result in enumerate(results):
        snippet = result["snippet"]

        # Try to fetch full page text for first 3 results
        if i < 3 and result["url"]:
            page_text = fetch_page_text(result["url"])
            if page_text:
                snippet = page_text

        context_parts.append(
            f"Source {i+1}: {result['title']}\n{snippet}"
        )

    context = "\n\n".join(context_parts)
    print(f"RAG: Built context from {len(results)} sources.")
    return context
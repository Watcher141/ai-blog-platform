from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from rag import build_rag_context
import json
import re

load_dotenv()

# ✅ Switch to a model with larger context and better JSON compliance
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7, max_tokens=2000)

prompt = PromptTemplate.from_template("""
You are a professional blog writer with access to real, up-to-date research.

Use the reference material below to write a detailed, accurate, and engaging blog post.

Topic: {topic}

Reference Material (from live web search):
{context}

Instructions:
- Write a detailed blog between 800-1000 words — aim for this range
- Keep content UNDER 1000 words to avoid truncation
- Use the reference material to include real facts and current information
- Structure the content with clear paragraphs and smooth transitions
- Make it engaging, informative, and easy to read
- Generate 4-6 relevant tags

Return ONLY valid JSON in this format:

{{
  "title": "Blog title",
  "content": "Full blog content here as plain paragraphs",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}}

CRITICAL RULES:
- DO NOT add explanation
- DO NOT wrap in markdown
- DO NOT use newlines inside string values
- DO NOT use bullet points or asterisks
- Keep content UNDER 600 words to avoid truncation
""")


def clean_json_string(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()
    return cleaned


def generate_blog(topic: str):
    context = build_rag_context(topic)
    response = llm.invoke(prompt.format(topic=topic, context=context))
    raw_output = response.content

    cleaned = clean_json_string(raw_output)

    # ✅ First try — direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # ✅ Second try — manual field extraction
    try:
        title_match = re.search(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', cleaned)
        tags_match = re.search(r'"tags"\s*:\s*(\[.*?\])', cleaned, re.DOTALL)
        content_match = re.search(r'"content"\s*:\s*"(.*?)"\s*,\s*"tags"', cleaned, re.DOTALL)

        if title_match and content_match and tags_match:
            title = title_match.group(1)
            content = content_match.group(1)
            content = content.replace('\n', ' ').replace('\r', ' ')
            tags = json.loads(tags_match.group(1))
            return {
                "title": title,
                "content": content,
                "tags": tags
            }
    except Exception as e:
        print(f"Manual extraction error: {e}")

    # ✅ Third try — ask the LLM to fix its own broken JSON
    try:
        fix_prompt = f"""The following JSON is malformed. Fix it and return ONLY valid JSON, nothing else.
Keep all the content intact. Escape any unescaped double quotes inside string values.
If the content is truncated, end the sentence cleanly and close the JSON properly.

Malformed JSON:
{cleaned[:3000]}

Return ONLY the fixed JSON:"""
        fix_response = llm.invoke(fix_prompt)
        fixed = clean_json_string(fix_response.content)
        return json.loads(fixed)
    except Exception as e:
        print(f"LLM fix error: {e}")

    print("RAW OUTPUT:", raw_output)
    raise ValueError("Failed to parse blog JSON from LLM response")


class ChainWrapper:
    def invoke(self, inputs):
        return generate_blog(inputs["topic"])


chain = ChainWrapper()
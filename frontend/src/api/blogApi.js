import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: BASE_URL,
});

export const fetchBlogs = () => API.get("/blogs");
export const searchBlogs = (q) =>
  API.get(`/blogs/search?q=${encodeURIComponent(q)}`);
export const fetchMyBlogs = (token) =>
  API.get("/users/me/blogs", { headers: { Authorization: `Bearer ${token}` } });
export const fetchMyDrafts = (token) =>
  API.get("/users/me/drafts", {
    headers: { Authorization: `Bearer ${token}` },
  });
export const generateBlog = (token, topic) =>
  API.post(
    "/blogs/generate",
    {},
    { params: { topic }, headers: { Authorization: `Bearer ${token}` } },
  );
export const fetchBlog = (id) => API.get(`/blogs/${id}`);
export const publishDraft = (token, blogId) =>
  API.post(
    `/blogs/${blogId}/publish`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const saveDraft = (token, title, content, tags) =>
  API.post(
    "/blogs/draft",
    { title, content, tags },
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const getSuggestion = (token, text) =>
  API.post(
    "/suggest",
    { text },
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const analyzeSEO = (token, title, content) =>
  API.post(
    "/blogs/seo",
    { title, content },
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const summarizeBlog = (title, content) =>
  API.post("/blogs/summarize", { title, content });

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API = axios.create({ baseURL: BASE_URL });

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        const { clearAuth } = require("../services/auth");
        clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (status === 429) {
        console.warn("Rate limited:", data?.detail);
      } else if (status >= 500) {
        console.error("Server error:", data?.detail || "Unknown error");
      }
    } else if (error.request) {
      console.error("Network error: server unreachable");
    }
    return Promise.reject(error);
  }
);

export const fetchBlogs = (signal, skip = 0, limit = 20) =>
  API.get("/blogs", { params: { skip, limit }, signal });
export const searchBlogs = (q, signal, skip = 0, limit = 20) =>
  API.get(`/blogs/search?q=${encodeURIComponent(q)}`, { params: { skip, limit }, signal });
export const fetchMyBlogs = (token, signal, skip = 0, limit = 20) =>
  API.get("/users/me/blogs", {
    params: { skip, limit },
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
export const fetchMyDrafts = (token, signal, skip = 0, limit = 20) =>
  API.get("/users/me/drafts", {
    params: { skip, limit },
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
export const generateBlog = (token, topic, signal) =>
  API.post(
    "/blogs/generate",
    {},
    { params: { topic }, headers: { Authorization: `Bearer ${token}` }, signal },
  );
export const fetchBlog = (id, signal) => API.get(`/blogs/${id}`, { signal });
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
export const getSuggestion = (token, text, signal) =>
  API.post(
    "/suggest",
    { text },
    { headers: { Authorization: `Bearer ${token}` }, signal },
  );
export const analyzeSEO = (token, title, content) =>
  API.post(
    "/blogs/seo",
    { title, content },
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const summarizeBlog = (title, content) =>
  API.post("/blogs/summarize", { title, content });

export const getMyProfile = (token, signal) =>
  API.get("/users/me/profile", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
export const createProfile = (token, data) =>
  API.post("/users/me/profile", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const updateProfile = (token, data) =>
  API.patch("/users/me/profile", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getPublicProfile = (username, signal) =>
  API.get(`/u/${username}`, { signal });
export const checkUsername = (username) =>
  API.get(`/users/check-username/${username}`);

export const toggleLike = (token, blogId) =>
  API.post(
    `/blogs/${blogId}/like`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const getLikeStatus = (token, blogId, signal) =>
  API.get(`/blogs/${blogId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

export const getComments = (blogId, signal) => API.get(`/blogs/${blogId}/comments`, { signal });
export const addComment = (token, blogId, content) =>
  API.post(
    `/blogs/${blogId}/comments`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const deleteComment = (token, commentId) =>
  API.delete(`/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const toggleFollow = (token, uid) =>
  API.post(
    `/users/${uid}/follow`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const getFollowStatus = (token, uid, signal) =>
  API.get(`/users/${uid}/follow`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

export const getNotifications = (token, signal) =>
  API.get("/users/me/notifications", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
export const getUnreadCount = (token, signal) =>
  API.get("/users/me/notifications/unread", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
export const markNotificationsRead = (token) =>
  API.post(
    "/users/me/notifications/read",
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const updateCoverImage = (token, blogId, coverImage) =>
  API.patch(
    `/blogs/${blogId}/cover`,
    { cover_image: coverImage },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

export const deleteBlog = (token, blogId) =>
  API.delete(`/blogs/${blogId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

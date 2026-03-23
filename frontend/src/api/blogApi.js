import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API = axios.create({ baseURL: BASE_URL });

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

// Profile
export const getMyProfile = (token) =>
  API.get("/users/me/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
export const createProfile = (token, data) =>
  API.post("/users/me/profile", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const updateProfile = (token, data) =>
  API.patch("/users/me/profile", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getPublicProfile = (username) => API.get(`/u/${username}`);
export const checkUsername = (username) =>
  API.get(`/users/check-username/${username}`);

// ✅ Likes
export const toggleLike = (token, blogId) =>
  API.post(
    `/blogs/${blogId}/like`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const getLikeStatus = (token, blogId) =>
  API.get(`/blogs/${blogId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// ✅ Comments
export const getComments = (blogId) => API.get(`/blogs/${blogId}/comments`);
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

// ✅ Follows
export const toggleFollow = (token, uid) =>
  API.post(
    `/users/${uid}/follow`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
export const getFollowStatus = (token, uid) =>
  API.get(`/users/${uid}/follow`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// ✅ Notifications
export const getNotifications = (token) =>
  API.get("/users/me/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getUnreadCount = (token) =>
  API.get("/users/me/notifications/unread", {
    headers: { Authorization: `Bearer ${token}` },
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

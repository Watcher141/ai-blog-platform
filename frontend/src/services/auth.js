import axios from "axios";
import { isFirebaseAvailable, getFirebaseAuth } from "../firebase/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API = axios.create({ baseURL: BASE_URL });

const TOKEN_KEY = "blog_jwt";
const USER_KEY = "blog_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function onAuthEvent(callback) {
  const handler = (e) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export async function registerUser(email, password) {
  if (isFirebaseAvailable()) {
    try {
      const fbAuth = getFirebaseAuth();
      const fbResult = await createUserWithEmailAndPassword(fbAuth, email, password);
      const idToken = await fbResult.user.getIdToken();
      const res = await API.post("/auth/register-firebase", {
        uid: fbResult.user.uid,
        email,
        displayName: fbResult.user.displayName,
      });
      const data = res.data;
      saveAuth(idToken, { id: fbResult.user.uid, email, displayName: data.user?.displayName });
      return { user: { id: fbResult.user.uid, email }, token: idToken };
    } catch (fbErr) {
      throw new Error(fbErr.message);
    }
  }
  const res = await API.post("/auth/register", { email, password });
  const { token, user } = res.data;
  saveAuth(token, user);
  return { user, token };
}

export async function loginUser(email, password) {
  if (isFirebaseAvailable()) {
    try {
      const fbAuth = getFirebaseAuth();
      const fbResult = await signInWithEmailAndPassword(fbAuth, email, password);
      const idToken = await fbResult.user.getIdToken();
      saveAuth(idToken, { id: fbResult.user.uid, email, displayName: fbResult.user.displayName });
      return { user: { id: fbResult.user.uid, email }, token: idToken };
    } catch (fbErr) {
      throw new Error(fbErr.message);
    }
  }
  const res = await API.post("/auth/login", { email, password });
  const { token, user } = res.data;
  saveAuth(token, user);
  return { user, token };
}

export async function logoutUser() {
  if (isFirebaseAvailable()) {
    try {
      const fbAuth = getFirebaseAuth();
      await signOut(fbAuth);
    } catch (e) {
      console.warn("Firebase sign-out error:", e);
    }
  }
  clearAuth();
}

export async function getToken() {
  if (isFirebaseAvailable()) {
    const fbAuth = getFirebaseAuth();
    const user = fbAuth.currentUser;
    if (user) {
      try {
        return await user.getIdToken(true);
      } catch {
        const token = getStoredToken();
        if (token && isTokenExpired(token)) { clearAuth(); return null; }
        return token;
      }
    }
  }
  const token = getStoredToken();
  if (token && isTokenExpired(token)) { clearAuth(); return null; }
  return token;
}

export async function verifyToken() {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await API.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { user: res.data, token };
  } catch {
    clearAuth();
    return null;
  }
}

export function onAuthChange(callback) {
  if (!isFirebaseAvailable()) {
    callback(null);
    return () => {};
  }
  const fbAuth = getFirebaseAuth();
  const unsubscribe = onAuthStateChanged(fbAuth, (user) => {
    callback(user);
  });
  return unsubscribe;
}

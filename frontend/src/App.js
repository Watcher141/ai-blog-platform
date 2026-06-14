import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MyBlogsPage from "./pages/MyBlogsPage";
import BlogViewPage from "./pages/BlogViewPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import { setUser, logout } from "./features/authSlice";
import { getStoredToken, getStoredUser, onAuthEvent } from "./services/auth";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      dispatch(setUser({ user, token }));
    }
    const unsub = onAuthEvent(() => {
      const t = getStoredToken();
      const u = getStoredUser();
      if (t && u) dispatch(setUser({ user: u, token: t }));
      else dispatch(logout());
    });
    return unsub;
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/blogs/:id" element={<BlogViewPage />} />
            <Route
              path="/my-blogs"
              element={
                <ProtectedRoute>
                  <MyBlogsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

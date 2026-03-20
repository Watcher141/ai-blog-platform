import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MyBlogsPage from "./pages/MyBlogsPage";
import BlogViewPage from "./pages/BlogViewPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // ✅ REMOVED the duplicate onAuthStateChanged from here
  // index.js AuthLoader already handles this

  return (
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;

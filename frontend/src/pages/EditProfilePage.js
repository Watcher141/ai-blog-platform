import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { auth } from "../firebase/firebase";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  checkUsername,
} from "../api/blogApi";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import "./EditProfilePage.css";

const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export default function EditProfilePage() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const urlDebounceRef = useRef(null); // declared inside component, outside JSX

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [imgError, setImgError] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [imgQuery, setImgQuery] = useState("");
  const [imgResults, setImgResults] = useState([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [showImgPicker, setShowImgPicker] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const token = await auth.currentUser.getIdToken(true);
        const res = await getMyProfile(token);
        if (res.data) {
          setProfile(res.data);
          setUsername(res.data.username || "");
          setDisplayName(res.data.display_name || "");
          setBio(res.data.bio || "");
          setAvatarUrl(res.data.avatar_url || "");
          setUrlInput(res.data.avatar_url || "");
        } else {
          setIsNew(true);
        }
      } catch {
        setIsNew(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(urlDebounceRef.current);
  }, []);

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    setImgError(false);
    clearTimeout(urlDebounceRef.current);
    if (!val.trim()) {
      setAvatarUrl("");
      return;
    }
    urlDebounceRef.current = setTimeout(() => {
      setAvatarUrl(val.trim());
    }, 600);
  };

  const handleUsernameChange = async (val) => {
    setUsername(val);
    setUsernameStatus("");
    if (val.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await checkUsername(val);
      if (profile?.username === val) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus(res.data.available ? "available" : "taken");
      }
    } catch {
      setUsernameStatus("");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleImageSearch = async () => {
    if (!imgQuery.trim() || !UNSPLASH_KEY) return;
    setImgLoading(true);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(imgQuery)}&per_page=6&orientation=squarish`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
      );
      const data = await res.json();
      setImgResults(
        data.results?.map((img) => ({
          url: img.urls.small,
          full: img.urls.regular,
          author: img.user.name,
        })) || [],
      );
    } catch (err) {
      console.error(err);
    } finally {
      setImgLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      showToast("Username is required.", "error");
      return;
    }
    if (usernameStatus === "taken") {
      showToast("Username is taken.", "error");
      return;
    }
    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const data = {
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() && !imgError ? avatarUrl.trim() : null,
      };
      if (isNew) {
        await createProfile(token, data);
        setIsNew(false);
      } else {
        await updateProfile(token, data);
      }
      showToast("Profile saved!");
      setTimeout(() => navigate(`/u/${username.trim()}`), 1200);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save profile.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="editprofile-loading">
        <div className="ep-dot" />
        <div className="ep-dot" />
        <div className="ep-dot" />
      </div>
    );

  return (
    <div className="editprofile-page">
      <div className="container">
        <div className="editprofile-box">
          <div className="editprofile-header">
            <h1 className="editprofile-title">
              {isNew ? "Create Profile" : "Edit Profile"}
            </h1>
            <p className="editprofile-sub">How the world sees you.</p>
          </div>

          {/* Avatar */}
          <div className="editprofile-avatar-section">
            <div className="editprofile-avatar">
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{username?.slice(0, 2).toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="editprofile-avatar-actions">
              <button
                className="ep-img-btn"
                onClick={() => setShowImgPicker(!showImgPicker)}
              >
                {showImgPicker ? "✕ Close" : "✦ Search Photo"}
              </button>

              {/* URL paste input */}
              <div className="ep-url-wrap">
                <input
                  className="ep-input ep-input-sm"
                  placeholder="Or paste image URL..."
                  value={urlInput}
                  onChange={handleUrlChange}
                  style={{ marginBottom: 0 }}
                />
              </div>

              {avatarUrl && !imgError && urlInput && (
                <span className="ep-url-hint">✓ Preview updated</span>
              )}
              {imgError && urlInput && (
                <span className="ep-url-error">
                  ✕ Can't load image — try a direct URL ending in .jpg/.png
                </span>
              )}
            </div>
          </div>

          {/* Image picker */}
          {showImgPicker && (
            <div className="ep-img-picker">
              <div className="ep-img-search">
                <input
                  className="ep-input"
                  placeholder="Search photos..."
                  value={imgQuery}
                  onChange={(e) => setImgQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImageSearch()}
                />
                <button
                  className="ep-search-btn"
                  onClick={handleImageSearch}
                  disabled={imgLoading}
                >
                  {imgLoading ? "..." : "Search"}
                </button>
              </div>
              <div className="ep-img-grid">
                {imgResults.map((img, i) => (
                  <div
                    key={i}
                    className="ep-img-item"
                    onClick={() => {
                      setAvatarUrl(img.full);
                      setUrlInput(img.full);
                      setImgError(false);
                      setShowImgPicker(false);
                    }}
                  >
                    <img src={img.url} alt={img.author} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="editprofile-fields">
            <div className="ep-field">
              <label className="ep-label">Username *</label>
              <div className="ep-username-wrap">
                <span className="ep-at">@</span>
                <input
                  className="ep-input ep-input-username"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) =>
                    handleUsernameChange(
                      e.target.value.toLowerCase().replace(/\s/g, ""),
                    )
                  }
                />
                {checkingUsername && (
                  <span className="ep-checking">checking...</span>
                )}
                {!checkingUsername && usernameStatus === "available" && (
                  <span className="ep-available">✓ available</span>
                )}
                {!checkingUsername && usernameStatus === "taken" && (
                  <span className="ep-taken">✕ taken</span>
                )}
              </div>
            </div>

            <div className="ep-field">
              <label className="ep-label">Display Name</label>
              <input
                className="ep-input"
                placeholder="Your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="ep-field">
              <label className="ep-label">Bio</label>
              <textarea
                className="ep-textarea"
                placeholder="Tell the world about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="editprofile-actions">
            <button
              className="ep-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isNew
                  ? "Create Profile →"
                  : "Save Changes →"}
            </button>
            {!isNew && (
              <button className="ep-cancel-btn" onClick={() => navigate(-1)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getPublicProfile,
  toggleFollow,
  getFollowStatus,
} from "../api/blogApi";
import { auth } from "../firebase/firebase";
import BlogCard from "../components/BlogCard";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPublicProfile(username);
        setProfile(res.data);
        setFollowerCount(res.data.follower_count || 0);

        if (user && res.data.firebase_uid) {
          const token = await auth.currentUser.getIdToken(true);
          const followRes = await getFollowStatus(token, res.data.firebase_uid);
          setFollowing(followRes.data.following);
        }
      } catch {
        setError("User not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setFollowLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await toggleFollow(token, profile.firebase_uid);
      setFollowing(res.data.following);
      setFollowerCount(res.data.follower_count);
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile =
    user && profile?.firebase_uid && user.uid === profile.firebase_uid;

  if (loading)
    return (
      <div className="profile-loading">
        <div className="p-dot" />
        <div className="p-dot" />
        <div className="p-dot" />
      </div>
    );

  if (error)
    return (
      <div className="profile-error">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>← Back home</button>
      </div>
    );

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-hero">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <span>{profile.username?.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h1 className="profile-display-name">
                {profile.display_name || `@${profile.username}`}
              </h1>
              {!isOwnProfile && (
                <button
                  className={`follow-btn ${following ? "following" : ""}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? "..." : following ? "Following ✓" : "Follow"}
                </button>
              )}
              {isOwnProfile && (
                <button
                  className="edit-profile-btn"
                  onClick={() => navigate("/profile/edit")}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <p className="profile-username">@{profile.username}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-num">
                  {profile.blogs?.length || 0}
                </span>
                <span className="profile-stat-label">blogs</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">{followerCount}</span>
                <span className="profile-stat-label">followers</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">
                  {profile.following_count || 0}
                </span>
                <span className="profile-stat-label">following</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-blogs-header">
          <h2 className="profile-blogs-title">
            Written by @{profile.username}
          </h2>
        </div>

        {profile.blogs?.length === 0 && (
          <div className="profile-empty">
            <p>No blogs published yet.</p>
          </div>
        )}

        <div className="profile-blogs-grid">
          {profile.blogs?.map((blog, i) => (
            <div key={blog.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>
      </div>

      {showLoginPrompt && (
        <div
          className="login-prompt-overlay"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Join to follow</h3>
            <p>Create an account or log in to follow users.</p>
            <div className="login-prompt-actions">
              <button
                className="login-prompt-btn-primary"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="login-prompt-btn-secondary"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
              <button
                className="login-prompt-close"
                onClick={() => setShowLoginPrompt(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

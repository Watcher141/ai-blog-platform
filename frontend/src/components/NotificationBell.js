import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
} from "../api/blogApi";
import "./NotificationBell.css";

export default function NotificationBell() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const token = await auth.currentUser.getIdToken(true);
        const [notifRes, countRes] = await Promise.all([
          getNotifications(token),
          getUnreadCount(token),
        ]);
        setNotifications(notifRes.data);
        setUnread(countRes.data.count);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    // Poll every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unread > 0) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        await markNotificationsRead(token);
        setUnread(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: "true" })),
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClick = (notif) => {
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const iconMap = { like: "♥", comment: "💬", follow: "👤", new_blog: "✦" };

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={handleOpen}>
        🔔
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unread === 0 && (
              <span className="notif-all-read">All caught up!</span>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="notif-empty">No notifications yet.</p>
          )}

          <div className="notif-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.is_read === "false" ? "unread" : ""}`}
                onClick={() => handleClick(n)}
              >
                <span className="notif-icon">{iconMap[n.type] || "✦"}</span>
                <div className="notif-body">
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-time">{formatTime(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

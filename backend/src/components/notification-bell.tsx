"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    fetchNotifications();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-md hover:bg-zinc-800 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
            <span className="text-sm font-medium text-[var(--foreground)]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-[var(--accent)] hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.href = n.link; }}
                  className={`px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors ${!n.read ? "bg-[var(--accent)]/5" : ""}`}
                >
                  <p className={`text-sm ${!n.read ? "font-medium text-[var(--foreground)]" : "text-zinc-400"}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

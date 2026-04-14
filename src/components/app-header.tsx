"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { RippleLogo } from "./ripple-logo";
import { NotificationBell } from "./notification-bell";
import { useGlobalSearch } from "./global-search";
import {
  ALL_ROLES,
  ROLE_DISPLAY_LABELS,
  VIEW_AS_COOKIE,
  VIEW_AS_STORAGE_KEY,
  type UserRole,
} from "@/lib/auth-types";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  PRODUCT_MANAGER: "PM",
  ANALYST: "Analyst",
  CONTENT_WRITER: "Writer",
};

interface AppHeaderProps {
  domainId: string;
  domainName: string;
}

function setViewAsCookie(role: string | null) {
  if (role) {
    document.cookie = `${VIEW_AS_COOKIE}=${role};path=/;max-age=${60 * 60 * 24}`;
  } else {
    document.cookie = `${VIEW_AS_COOKIE}=;path=/;max-age=0`;
  }
}

export function AppHeader({ domainId, domainName }: AppHeaderProps) {
  const { data: session } = useSession();
  const { setIsOpen: setSearchOpen } = useGlobalSearch();
  const [userOpen, setUserOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || session?.user?.email || "";
  const realRole = ((session?.user as { role?: string })?.role ?? "PRODUCT_MANAGER") as UserRole;
  const isAdmin = realRole === "ADMIN";
  const effectiveRole = viewAsRole ?? realRole;
  const isImpersonating = viewAsRole !== null && viewAsRole !== realRole;

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("") || "?";

  useEffect(() => {
    if (isAdmin) {
      const stored = localStorage.getItem(VIEW_AS_STORAGE_KEY) as UserRole | null;
      if (stored && ALL_ROLES.includes(stored)) {
        setViewAsRole(stored);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRoleSwitch = (role: UserRole | null) => {
    if (role && role !== realRole) {
      localStorage.setItem(VIEW_AS_STORAGE_KEY, role);
      setViewAsCookie(role);
      setViewAsRole(role);
    } else {
      localStorage.removeItem(VIEW_AS_STORAGE_KEY);
      setViewAsCookie(null);
      setViewAsRole(null);
    }
    setRoleOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative z-[60] shrink-0">
      {isImpersonating && (
        <div className="h-7 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-center gap-3 px-4">
          <span className="text-[11px] font-medium text-amber-400">
            Viewing as {ROLE_DISPLAY_LABELS[effectiveRole]}
          </span>
          <button
            onClick={() => handleRoleSwitch(null)}
            className="text-[10px] font-medium text-amber-300 hover:text-amber-100 underline underline-offset-2 transition-colors"
          >
            Reset to {ROLE_DISPLAY_LABELS[realRole]}
          </button>
        </div>
      )}
      <header className="h-12 border-b border-[var(--card-border)] bg-[var(--card)] px-4 flex items-center justify-between gap-4">
        {/* Left: Logo + domain */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/select-domain" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <RippleLogo size={26} variant="compact" />
          </Link>
          <span className="text-zinc-600 text-sm">/</span>
          <Link
            href={`/domain/${domainId}/dashboard`}
            className="text-sm text-zinc-300 hover:text-zinc-100 truncate max-w-[180px] transition-colors"
            title={domainName}
          >
            {domainName}
          </Link>
          <Link
            href="/select-domain"
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
          >
            Switch
          </Link>
        </div>

        {/* Right: View as + Notifications + User */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div ref={roleRef} className="relative">
              <button
                onClick={() => setRoleOpen(!roleOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  isImpersonating
                    ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {isImpersonating ? ROLE_LABELS[effectiveRole] : "View as"}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>

              {roleOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-50 overflow-hidden py-1">
                  {ALL_ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r === realRole ? null : r)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        effectiveRole === r
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                      }`}
                    >
                      <span>{ROLE_DISPLAY_LABELS[r]}</span>
                      {r === realRole && (
                        <span className="text-[9px] uppercase tracking-wider text-zinc-600">(you)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Search (⌘K)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          <NotificationBell />

          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserOpen(!userOpen)}
              className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-semibold text-white hover:ring-2 hover:ring-[var(--accent)]/40 transition-all"
            >
              {initials}
            </button>

            {userOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-sm font-medium text-zinc-200 truncate">{userName}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {ROLE_LABELS[realRole] ?? realRole}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

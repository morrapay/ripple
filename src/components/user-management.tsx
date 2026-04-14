"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth-types";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "PRODUCT_MANAGER", label: "Product Manager" },
  { value: "ANALYST", label: "Analyst" },
  { value: "CONTENT_WRITER", label: "Content Writer" },
];

export function UserManagement() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: string })?.role ?? "PRODUCT_MANAGER") as UserRole;
  const currentUserId = (session?.user as { id?: string })?.id;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("PRODUCT_MANAGER");
  const [inviteResult, setInviteResult] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (userId: string, role: UserRole) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Remove this user?")) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    fetchUsers();
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInviteResult("");
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult(`Invited! Temp password: ${data.tempPassword}`);
        setInviteEmail("");
        setInviteName("");
        fetchUsers();
      } else {
        setInviteResult(data.error || "Failed");
      }
    } finally { setLoading(false); }
  };

  const availableRoles = currentRole === "ADMIN" ? ROLES : ROLES.filter((r) => r.value !== "ADMIN");

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-left">
              <th className="px-4 py-3 text-zinc-400 font-medium">User</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Role</th>
              <th className="px-4 py-3 text-zinc-400 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-[var(--foreground)]">{u.name || u.email}</p>
                  {u.name && <p className="text-xs text-zinc-500">{u.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                    disabled={u.id === currentUserId}
                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-[var(--foreground)] disabled:opacity-50"
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <button onClick={() => removeUser(u.id)} className="text-xs text-red-400 hover:text-red-300">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Invite New User</h3>
        <form onSubmit={inviteUser} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
              className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-sm text-[var(--foreground)] w-56" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name (optional)</label>
            <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-sm text-[var(--foreground)] w-40" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-sm text-[var(--foreground)]">
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="px-4 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 hover:bg-[var(--accent-muted)]">
            {loading ? "Inviting…" : "Invite"}
          </button>
        </form>
        {inviteResult && <p className="mt-3 text-xs text-emerald-400">{inviteResult}</p>}
      </div>
    </div>
  );
}

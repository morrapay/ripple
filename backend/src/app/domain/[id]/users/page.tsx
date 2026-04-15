import { UserManagement } from "@/components/user-management";

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        User Management
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Manage team members and their roles.
      </p>
      <UserManagement />
    </div>
  );
}

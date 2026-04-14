"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { canAccessPage, canManageUsers, ALL_ROLES, VIEW_AS_STORAGE_KEY, type UserRole } from "@/lib/auth-types";

const processItems = [
  { href: "data-layer", label: "Data Layer", page: "data-layer" },
  { href: "mapping", label: "Mapping", page: "mapping", wip: true },
  { href: "communications", label: "Communications", page: "communications", wip: true },
  { href: "preferences", label: "Preferences", page: "preferences", wip: true },
];

const referenceItems = [
  { href: "channels", label: "Channels & Rules", page: "channels" },
  { href: "archive", label: "Archive", page: "archive", wip: true },
];

interface SidebarNavProps {
  domainId: string;
}

function NavLink({
  href, label, isActive, wip,
}: {
  href: string; label: string; isActive: boolean; wip?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
        isActive
          ? "bg-[var(--accent)]/20 text-[var(--accent)] font-medium"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      }`}
    >
      <span>{label}</span>
      {wip && (
        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-amber-500/20 text-amber-400">
          WIP
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({ domainId }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const basePath = `/domain/${domainId}`;
  const realRole = ((session?.user as { role?: string })?.role ?? "PRODUCT_MANAGER") as UserRole;
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (realRole === "ADMIN") {
      const stored = localStorage.getItem(VIEW_AS_STORAGE_KEY) as UserRole | null;
      if (stored && ALL_ROLES.includes(stored)) {
        setViewAsRole(stored);
      }
    }
  }, [realRole]);

  const role = viewAsRole ?? realRole;

  const dashboardHref = `${basePath}/dashboard`;
  const isDashboardActive = pathname === dashboardHref || pathname?.startsWith(dashboardHref + "/");

  const filteredProcess = processItems.filter((i) => canAccessPage(role, i.page));
  const filteredReference = referenceItems.filter((i) => canAccessPage(role, i.page));

  return (
    <aside className="w-48 shrink-0 h-full overflow-y-auto border-r border-[var(--card-border)] bg-[var(--card)] px-3 py-4 flex flex-col">
      <nav className="space-y-4 flex-1">
        <div>
          <NavLink href={dashboardHref} label="Dashboard" isActive={isDashboardActive} />
        </div>

        {filteredProcess.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-[10px] text-zinc-500 uppercase tracking-wider">Process</p>
            <div className="space-y-0.5">
              {filteredProcess.map((item) => {
                const href = `${basePath}/${item.href}`;
                const isActive = pathname === href || pathname?.startsWith(href + "/");
                return <NavLink key={item.href} href={href} label={item.label} isActive={isActive} wip={item.wip} />;
              })}
            </div>
          </div>
        )}

        {filteredReference.length > 0 && (
          <div>
            <p className="px-3 mb-2 text-[10px] text-zinc-500 uppercase tracking-wider">Reference</p>
            <div className="space-y-0.5">
              {filteredReference.map((item) => {
                const href = `${basePath}/${item.href}`;
                const isActive = pathname === href || pathname?.startsWith(href + "/");
                return <NavLink key={item.href} href={href} label={item.label} isActive={isActive} wip={item.wip} />;
              })}
            </div>
          </div>
        )}

        {canManageUsers(role) && (
          <div>
            <NavLink
              href={`${basePath}/users`}
              label="User Management"
              isActive={pathname === `${basePath}/users`}
            />
          </div>
        )}
      </nav>
    </aside>
  );
}

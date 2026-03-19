"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RippleLogo } from "./ripple-logo";

const processItems = [
  { href: "data-layer", label: "Data Layer", underConstruction: false },
  { href: "mapping", label: "Mapping", underConstruction: true },
  { href: "communications", label: "Communications", underConstruction: true },
];

const referenceItems = [
  { href: "channels", label: "Channels & Rules", underConstruction: false },
  { href: "archive", label: "Archive", underConstruction: true },
];

interface SidebarNavProps {
  domainId: string;
  domainName: string;
}

function NavLink({
  href,
  label,
  isActive,
  underConstruction,
}: {
  href: string;
  label: string;
  isActive: boolean;
  underConstruction?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm ${
        isActive
          ? "bg-[var(--accent)]/20 text-[var(--accent)] font-medium"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      }`}
    >
      <span>{label}</span>
      {underConstruction && (
        <span
          className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-amber-500/20 text-amber-400"
          title="Under construction"
        >
          WIP
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({ domainId, domainName }: SidebarNavProps) {
  const pathname = usePathname();
  const basePath = `/domain/${domainId}`;

  const dashboardHref = `${basePath}/dashboard`;
  const isDashboardActive =
    pathname === dashboardHref || pathname?.startsWith(dashboardHref + "/");

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="pb-4 mb-4 border-b border-[var(--card-border)]">
        <Link
          href="/select-domain"
          className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
        >
          <RippleLogo size={32} variant="compact" />
        </Link>
      </div>
      <Link
        href="/select-domain"
        className="block text-sm text-zinc-500 hover:text-zinc-300 mb-6"
      >
        ← Change domain
      </Link>
      <div className="mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Domain</p>
        <p className="font-medium text-[var(--foreground)] truncate" title={domainName}>
          {domainName}
        </p>
      </div>
      <nav className="space-y-6">
        <div>
          <NavLink
            href={dashboardHref}
            label="Dashboard"
            isActive={isDashboardActive}
          />
        </div>

        <div>
          <p className="px-3 mb-2 text-xs text-zinc-500 uppercase tracking-wider">
            Process
          </p>
          <div className="space-y-1">
            {processItems.map((item) => {
              const href = `${basePath}/${item.href}`;
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <NavLink
                  key={item.href}
                  href={href}
                  label={item.label}
                  isActive={isActive}
                  underConstruction={item.underConstruction ?? false}
                />
              );
            })}
          </div>
        </div>

        <div className="pt-8">
          <p className="px-3 mb-2 text-xs text-zinc-500 uppercase tracking-wider">
            Reference
          </p>
          <div className="space-y-1">
            {referenceItems.map((item) => {
              const href = `${basePath}/${item.href}`;
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <NavLink
                  key={item.href}
                  href={href}
                  label={item.label}
                  isActive={isActive}
                  underConstruction={item.underConstruction ?? false}
                />
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}

import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { AppHeader } from "@/components/app-header";
import { SidebarNav } from "@/components/sidebar-nav";
import GlobalSearch from "@/components/global-search";

export default async function DomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const domain = await getDomainById(id);
  if (!domain) notFound();

  return (
    <div className="h-screen flex flex-col">
      <AppHeader domainId={id} domainName={domain.name} />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav domainId={id} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <GlobalSearch domainId={id} />
    </div>
  );
}

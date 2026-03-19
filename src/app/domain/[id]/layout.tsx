import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { SidebarNav } from "@/components/sidebar-nav";

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
    <div className="flex min-h-screen">
      <SidebarNav domainId={id} domainName={domain.name} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

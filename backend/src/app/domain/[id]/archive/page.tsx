import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const domain = await getDomainById(id);
  if (!domain) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        Archive & Export
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Export domain snapshot for documentation and auditability.
      </p>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-zinc-500">
        <p>Archive export UI — Iteration 5</p>
      </div>
    </div>
  );
}

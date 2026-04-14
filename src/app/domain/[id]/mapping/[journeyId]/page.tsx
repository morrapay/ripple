import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { JourneyCanvas } from "@/components/journey/journey-canvas";

export default async function JourneyCanvasPage({
  params,
}: {
  params: Promise<{ id: string; journeyId: string }>;
}) {
  const { id, journeyId } = await params;
  const domain = await getDomainById(id);
  if (!domain) notFound();

  return (
    <div className="fixed inset-0 top-12 left-48 bg-[var(--background)] z-30 flex flex-col">
      <JourneyCanvas domainId={id} journeyId={journeyId} />
    </div>
  );
}

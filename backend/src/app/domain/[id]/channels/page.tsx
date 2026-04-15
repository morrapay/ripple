import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { PolicyReference } from "@/components/policy-reference";
import { PolicyChatbot } from "@/components/policy-chatbot";

export default async function ChannelsPage({
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
        Channels & Rules
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Communication policy reference — channels, rules, audience, and design
        guidelines. All data is structured for AI-assisted channel selection.
      </p>

      <PolicyReference />
      <PolicyChatbot />
    </div>
  );
}

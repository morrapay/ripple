import { redirect } from "next/navigation";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/domain/${id}/dashboard`);
}

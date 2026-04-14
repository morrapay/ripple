import { PreferenceCenterBuilder } from "@/components/preference-center-builder";

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: domainId } = await params;
  return <PreferenceCenterBuilder domainId={domainId} />;
}

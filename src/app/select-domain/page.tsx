import { DomainSelector } from "@/components/domain-selector";
import { RippleLogo } from "@/components/ripple-logo";

export default function SelectDomainPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--background)]">
      <div className="w-full max-w-lg">
        <RippleLogo size={40} className="mb-6" />
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Ripple
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          Recreate customer communications into Braze. Select or create a domain to get started.
        </p>
        <DomainSelector />
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SupportedService {
  id: string;
  name: string;
  code: string;
}

interface ServiceReadinessCheckProps {
  domainId: string;
  initialSelectedServiceId: string | null;
}

export function ServiceReadinessCheck({
  domainId,
  initialSelectedServiceId,
}: ServiceReadinessCheckProps) {
  const router = useRouter();
  const [services, setServices] = useState<SupportedService[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedServiceId
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/supported-services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (serviceId: string | null) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedServiceId: serviceId,
        }),
      });
      if (res.ok) {
        setSelectedId(serviceId);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedId);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
      <h3 className="font-medium text-[var(--foreground)] mb-2">
        Is your service ready for events?
      </h3>
      <p className="text-sm text-zinc-400 mb-4">
        Only modern services support the new application framework. Select your
        service from the list below.
      </p>

      {loading ? (
        <div className="h-10 bg-zinc-800 rounded animate-pulse w-64" />
      ) : services.length === 0 ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium">No services in list yet</p>
          <p className="text-amber-200/80 mt-1">
            The closed list of supported services will appear here once uploaded.
            Use the API to add services:{" "}
            <code className="text-xs bg-zinc-800 px-1 rounded">
              POST /api/supported-services
            </code>{" "}
            with{" "}
            <code className="text-xs bg-zinc-800 px-1 rounded">
              {`{ "services": [{ "name": "...", "code": "..." }] }`}
            </code>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedId ?? ""}
            onChange={(e) =>
              handleChange(e.target.value ? e.target.value : null)
            }
            disabled={saving}
            className="px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm min-w-[200px] disabled:opacity-50"
          >
            <option value="">— Select your service —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          {selectedService && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Your service is ready for the application events framework
            </div>
          )}
        </div>
      )}
    </div>
  );
}

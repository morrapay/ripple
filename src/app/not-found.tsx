import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--background)]">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        404 — Page not found
      </h1>
      <p className="text-zinc-400 mb-6">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/select-domain"
        className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:opacity-90"
      >
        Go to home
      </Link>
    </div>
  );
}

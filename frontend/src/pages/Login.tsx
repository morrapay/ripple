import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-400 mb-2">Ripple dev shell</p>
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Sign in</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Auth UI is not wired here yet. Use the preview workspace to click through the Vite layout, or run the full
          Next.js app for real sign-in (needs Postgres and <code className="text-zinc-300">.env</code>).
        </p>
        <Link
          to="/domain/preview/dashboard"
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors mb-6"
        >
          Open preview workspace
        </Link>
        <div className="border-t border-zinc-800 pt-6 space-y-3 text-zinc-500 text-xs leading-relaxed">
          <p>
            <strong className="text-zinc-400">This stack:</strong> repo root <code className="text-zinc-400">npm run dev</code> →{" "}
            <code className="text-zinc-400">http://localhost:5188</code> (Vite) and API stub on{" "}
            <code className="text-zinc-400">:3000</code> proxied as <code className="text-zinc-400">/api</code>.
          </p>
          <p>
            <strong className="text-zinc-400">Full app:</strong> <code className="text-zinc-400">npm run dev:next</code> →{" "}
            <code className="text-zinc-400">http://localhost:3005</code>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Outlet, useParams } from "react-router-dom";

export default function DomainLayout() {
  const { id } = useParams();
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="w-56 border-r border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Ripple</h2>
        <nav className="space-y-1 text-sm text-zinc-400">
          <p>Domain: {id}</p>
          <p className="text-xs text-zinc-600 mt-4">Sidebar migration pending</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

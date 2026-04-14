"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        setError("Registered but could not sign in. Please log in manually.");
      } else {
        router.push("/select-domain");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create an account</h1>
        <p className="text-sm text-zinc-400 mt-2">Get started with Ripple</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            placeholder="Your name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            placeholder="you@payoneer.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            placeholder="Min 6 characters" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] transition-colors disabled:opacity-50">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

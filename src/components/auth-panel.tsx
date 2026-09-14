"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthPanel() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegistering ? { name, email, password } : { email, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to continue.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.8)] sm:p-8">
      <div className="mb-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300">The Dream Gallery</p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          {isRegistering ? "Create account" : "Welcome back"}
        </h1>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Full name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
              placeholder="Your full name"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
            placeholder="******"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          {isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsRegistering((current) => !current)}
        className="mt-4 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-slate-100 transition hover:bg-white/10"
      >
        {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
      </button>
    </div>
  );
}

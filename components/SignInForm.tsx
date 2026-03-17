"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type SignInFormProps = {
  compact?: boolean;
};

export function SignInForm({ compact = false }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile`
        : undefined;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("Check your email for the magic link.");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-[1.75rem] border border-line bg-panel/80 shadow-glow ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Sign in with email</h2>
        <p className="text-sm text-zinc-400">
          A magic link is enough for this MVP. No custom auth UI, no drama.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-accent"
            placeholder="you@example.com"
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending link..." : "Send magic link"}
        </button>
      </div>
    </form>
  );
}

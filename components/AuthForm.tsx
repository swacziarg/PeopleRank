"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureProfileForUser, getAuthenticatedUser } from "@/lib/authProfile";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  nextPath?: string;
};

export function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    nextPath && nextPath.startsWith("/") ? nextPath : "/profile";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }

      router.replace(redirectPath);
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: username.trim() ? { username: username.trim() } : undefined
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.user && data.session) {
      const authenticatedUser = (await getAuthenticatedUser(supabase)) ?? data.user;
      const { error: profileError } = await ensureProfileForUser(
        supabase,
        authenticatedUser,
        username
      );

      if (profileError) {
        setError(profileError.message);
        setSubmitting(false);
        return;
      }

      router.refresh();
      window.location.assign(redirectPath);
      return;
    }

    setMessage("Account created. Confirm your email, then log in.");
    setMode("login");
    setPassword("");
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl rounded-3xl border border-line bg-panel p-6">
      <div className="flex rounded-full border border-line bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setMessage("");
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-accent text-ink"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setMessage("");
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-accent text-ink"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-200">
              Username
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={40}
              className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
              placeholder="ranked-citizen"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
            placeholder="At least 6 characters"
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}

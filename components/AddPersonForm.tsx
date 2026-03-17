"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export function AddPersonForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?next=/add");
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from("people")
      .insert({
        name: name.trim(),
        created_by: user.id
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSuccess("Person created. Redirecting...");
    setName("");
    router.push(`/person/${data.id}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow"
    >
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-200">
          Name
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          placeholder="Captain of the group chat"
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
        />
      </label>

      <p className="mt-3 text-sm text-zinc-400">
        Authenticated users can create new entries. Keep names real enough to
        be funny and vague enough to avoid trouble.
      </p>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create person"}
      </button>
    </form>
  );
}

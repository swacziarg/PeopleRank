"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { cleanPersonName, normalizePersonName } from "@/lib/utils";

type CreatedPerson = {
  id: string;
  name: string;
  created_at: string;
};

type AddPersonFormProps = {
  className?: string;
  loginNextPath?: string;
  redirectOnCreate?: boolean;
  onPersonCreated?: (person: CreatedPerson) => void | Promise<void>;
};

export function AddPersonForm({
  className,
  loginNextPath = "/add",
  redirectOnCreate = true,
  onPersonCreated
}: AddPersonFormProps) {
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
      router.push(`/login?next=${encodeURIComponent(loginNextPath)}`);
      return;
    }

    const cleanedName = cleanPersonName(name);
    const normalizedName = normalizePersonName(name);

    if (!cleanedName) {
      setError("Enter a valid name.");
      return;
    }

    setSubmitting(true);
    const { data: existingPerson, error: duplicateCheckError } = await supabase
      .from("people")
      .select("id, name")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (duplicateCheckError) {
      setError(duplicateCheckError.message);
      setSubmitting(false);
      return;
    }

    if (existingPerson) {
      setError(`"${existingPerson.name}" already exists. Try rating that page instead.`);
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("people")
      .insert({
        name: cleanedName,
        created_by: user.id
      })
      .select("id, name, created_at")
      .single();

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That person already exists."
          : insertError.message
      );
      setSubmitting(false);
      return;
    }

    setSuccess(redirectOnCreate ? "Person created. Redirecting..." : "Person created.");
    setName("");
    await onPersonCreated?.(data);

    if (redirectOnCreate) {
      router.push(`/person/${data.id}`);
    }

    router.refresh();
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        "rounded-[1.75rem] border border-line bg-panel/80 p-6"
      }
    >
      <label htmlFor="person-name" className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-100">
          Name
        </span>
        <input
          id="person-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          placeholder="Captain of the group chat"
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white placeholder:text-zinc-400 focus:border-accent"
        />
      </label>

      <p className="mt-3 text-sm text-zinc-400">
        Authenticated users can create new entries. Keep names real enough to
        be funny and vague enough to avoid trouble.
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create person"}
      </button>
    </form>
  );
}

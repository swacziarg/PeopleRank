"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
  initialName?: string;
  loginNextPath?: string;
  redirectOnCreate?: boolean;
  onPersonCreated?: (person: CreatedPerson) => void | Promise<void>;
};

type SimilarPerson = {
  id: string;
  name: string;
};

export function AddPersonForm({
  className,
  initialName = "",
  loginNextPath = "/add",
  redirectOnCreate = true,
  onPersonCreated
}: AddPersonFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [similarPeople, setSimilarPeople] = useState<SimilarPerson[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [needsOverride, setNeedsOverride] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    const cleanedName = cleanPersonName(name);

    if (!isSupabaseConfigured || cleanedName.length < 2) {
      setSimilarPeople([]);
      setLoadingMatches(false);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setLoadingMatches(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error: searchError } = await supabase
        .from("people")
        .select("id, name")
        .ilike("name", `%${cleanedName}%`)
        .limit(5);

      if (!isActive) {
        return;
      }

      if (searchError) {
        setSimilarPeople([]);
        setLoadingMatches(false);
        return;
      }

      setSimilarPeople(data ?? []);
      setLoadingMatches(false);
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [name]);

  const submitPerson = async (overrideSimilar: boolean) => {
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

    const hasSimilarPeople = similarPeople.some(
      (person) => normalizePersonName(person.name) !== normalizedName
    );

    if (hasSimilarPeople && !overrideSimilar) {
      setNeedsOverride(true);
      setError("Possible matches found. Review them below or add anyway.");
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
    setNeedsOverride(false);
    setName("");
    setSimilarPeople([]);
    await onPersonCreated?.(data);

    if (redirectOnCreate) {
      router.push(`/person/${data.id}`);
    }

    router.refresh();
    setSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPerson(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        "rounded-3xl border border-line bg-panel p-6"
      }
    >
      <label htmlFor="person-name" className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-100">
          Name
        </span>
        <input
          id="person-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNeedsOverride(false);
          }}
          required
          maxLength={80}
          placeholder="Taylor"
          className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-accent"
        />
      </label>

      <p className="mt-3 text-sm text-zinc-400">
        Authenticated users can create new entries. Similar names are surfaced
        before submit so duplicates stay easy to spot.
      </p>

      <div className="mt-5 rounded-2xl border border-line bg-zinc-950 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">Possible matches</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {loadingMatches ? "Checking" : `${similarPeople.length} found`}
          </p>
        </div>

        {similarPeople.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">
            No similar names found.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {similarPeople.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/person/${person.id}`}
                  className="block rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-white transition-colors hover:border-zinc-500"
                >
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create person"}
        </button>
        {needsOverride ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void submitPerson(true);
            }}
            className="rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add anyway
          </button>
        ) : null}
      </div>
    </form>
  );
}

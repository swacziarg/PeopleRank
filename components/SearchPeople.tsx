"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { PersonSummary } from "@/types";

export function SearchPeople() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      setResults([]);
      setError("");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const supabase = getSupabaseBrowserClient();
      const { data, error: searchError } = await supabase
        .from("people")
        .select("id, name, created_at")
        .ilike("name", `%${trimmedQuery}%`)
        .order("name")
        .limit(25);

      if (searchError) {
        setError(searchError.message);
        setResults([]);
      } else {
        setResults(data ?? []);
      }

      setLoading(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Search by name
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for Taylor, Dracula, your old roommate..."
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Searching...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {!loading && query.trim().length > 0 && results.length === 0 && !error ? (
        <div className="rounded-3xl border border-dashed border-line bg-panel/70 p-8 text-center text-zinc-400">
          No matches found. That either means good database hygiene or a missed
          opportunity.
        </div>
      ) : null}

      <div className="grid gap-3">
        {results.map((person) => (
          <div
            key={person.id}
            className="flex flex-col gap-3 rounded-[1.5rem] border border-line bg-panel/80 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{person.name}</h2>
              <p className="text-sm text-zinc-500">ID: {person.id}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/person/${person.id}`}
                className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-white hover:border-zinc-500 hover:bg-white/10"
              >
                View
              </Link>
              <Link
                href={`/rate/${person.id}`}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-amber-300"
              >
                Rate
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PersonListItem } from "@/components/PersonListItem";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { buildRankedPeople } from "@/lib/utils";
import type { RankedPerson } from "@/types";

type SearchPeopleProps = {
  initialPeople: RankedPerson[];
};

export function SearchPeople({ initialPeople }: SearchPeopleProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RankedPerson[]>(initialPeople);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      setResults([]);
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      setResults(initialPeople);
      setError("");
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const supabase = getSupabaseBrowserClient();
      const { data, error: searchError } = await supabase
        .from("people")
        .select("id, name, created_at, ratings(stars, text)")
        .ilike("name", `%${trimmedQuery}%`)
        .limit(50);

      if (searchError) {
        setError(searchError.message);
        setResults([]);
      } else {
        setResults(buildRankedPeople(data ?? []));
      }

      setLoading(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [initialPeople, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow">
        <label htmlFor="search-people-query" className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-100">
            Search by name
          </span>
          <input
            id="search-people-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for Taylor, Dracula, your old roommate..."
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white placeholder:text-zinc-400 focus:border-accent"
          />
        </label>
        <p className="mt-3 text-sm text-zinc-300">
          Ranked by total ratings first, then comment count.
        </p>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {loading ? <p className="text-zinc-300">Loading ranked people...</p> : null}
        {error ? (
          <p role="alert" className="text-rose-300">
            {error}
          </p>
        ) : null}
      </div>

      {!loading && results.length === 0 && !error ? (
        <div className="rounded-3xl border border-dashed border-line bg-panel/70 p-8 text-center text-zinc-300">
          {query.trim().length > 0
            ? "No matching people found."
            : "No ranked people yet. Add someone to start the feed."}
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="rounded-[1.75rem] border border-line bg-panel/50 p-2">
          <ul className="grid max-h-[70vh] gap-3 overflow-y-auto p-2">
            {results.map((person) => (
              <PersonListItem key={person.id} person={person} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

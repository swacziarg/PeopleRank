"use client";

import { useEffect, useState } from "react";
import { AddPersonForm } from "@/components/AddPersonForm";
import { PersonListItem } from "@/components/PersonListItem";
import {
  createRankedPerson,
  fetchRankedPeople,
  sortRankedPeople,
  type RankedPeopleSort
} from "@/lib/rankedPeople";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { RankedPerson } from "@/types";

type SearchPeopleProps = {
  initialPeople: RankedPerson[];
};

const sortOptions: { label: string; value: RankedPeopleSort }[] = [
  { label: "Most rated", value: "most-rated" },
  { label: "Most commented", value: "most-commented" },
  { label: "Highest rated", value: "highest-rated" },
  { label: "Newest", value: "newest" }
];

export function SearchPeople({ initialPeople }: SearchPeopleProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<RankedPeopleSort>("most-rated");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [people, setPeople] = useState<RankedPerson[]>(initialPeople);
  const [results, setResults] = useState<RankedPerson[]>(initialPeople);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPeople(initialPeople);
  }, [initialPeople]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      setResults([]);
      return;
    }

    if (debouncedQuery.length === 0) {
      setError("");
      setLoading(false);
      setResults(sortRankedPeople(people, sort));
      return;
    }

    let isActive = true;

    const runSearch = async () => {
      setLoading(true);
      setError("");

      const supabase = getSupabaseBrowserClient();
      const rankedPeople = await fetchRankedPeople(supabase, {
        limit: 50,
        search: debouncedQuery,
        sort
      });

      if (!isActive) {
        return;
      }

      setResults(rankedPeople);
      setLoading(false);
    };

    void runSearch();

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, people, sort]);

  const handlePersonCreated = async (person: {
    id: string;
    name: string;
    created_at: string;
  }) => {
    const nextPeople = sortRankedPeople(
      [createRankedPerson(person), ...people],
      sort
    );

    setPeople(nextPeople);
    setResults(nextPeople);
    setQuery("");
    setDebouncedQuery("");
    setIsAddOpen(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-white/8 bg-panel/75 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label htmlFor="search-people-query" className="block flex-1">
            <span className="mb-2 block text-sm font-medium text-zinc-100">
              Search by name
            </span>
            <input
              id="search-people-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for Taylor, Dracula, your old roommate..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-accent"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] lg:min-w-[360px]">
            <label htmlFor="search-sort" className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-100">
                Sort by
              </span>
              <select
                id="search-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as RankedPeopleSort)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-accent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setIsAddOpen((open) => !open)}
              className="self-end rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {isAddOpen ? "Close form" : "Add new person"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          Search stays lightweight and sorting updates instantly.
        </p>
      </div>

      {isAddOpen ? (
        <AddPersonForm
          className="rounded-[1.75rem] border border-white/8 bg-panel/75 p-5 sm:p-6"
          loginNextPath="/search"
          redirectOnCreate={false}
          onPersonCreated={handlePersonCreated}
        />
      ) : null}

      <div className="min-h-6" aria-live="polite">
        {error ? (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            {loading ? "Updating results..." : `${results.length} people shown`}
          </p>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-white/8 bg-panel/45 p-2 sm:p-3">
        {loading && results.length === 0 ? (
          <div className="grid gap-3 p-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-[1.5rem] border border-white/6 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : null}

        {!loading && results.length === 0 && !error ? (
          <div className="p-8 text-center text-zinc-300">
            {debouncedQuery.length > 0
              ? "No matches yet. Try a broader name search or add a new person."
              : "No ranked people yet. Add someone to start the list."}
          </div>
        ) : null}

        {results.length > 0 ? (
          <ul className="grid gap-3 p-1">
            {results.map((person) => (
              <PersonListItem key={person.id} person={person} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

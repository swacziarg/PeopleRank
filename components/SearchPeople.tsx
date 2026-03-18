"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PersonListItem } from "@/components/PersonListItem";
import { fetchRankedPeoplePage, type RankedPeopleSort } from "@/lib/rankedPeople";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { RankedPerson } from "@/types";

type SearchPeopleProps = {
  initialPeople: RankedPerson[];
  initialPage: number;
  initialTotalCount: number;
  pageSize: number;
};

const sortOptions: { label: string; value: RankedPeopleSort }[] = [
  { label: "Most rated", value: "most-rated" },
  { label: "Most commented", value: "most-commented" },
  { label: "Highest rated", value: "highest-rated" },
  { label: "Newest", value: "newest" }
];

export function SearchPeople({
  initialPeople,
  initialPage,
  initialTotalCount,
  pageSize
}: SearchPeopleProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<RankedPeopleSort>("most-rated");
  const [results, setResults] = useState<RankedPerson[]>(initialPeople);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setResults(initialPeople);
    setPage(initialPage);
    setTotalCount(initialTotalCount);
  }, [initialPage, initialPeople, initialTotalCount]);

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
      setTotalCount(0);
      return;
    }

    let isActive = true;

    const runSearch = async () => {
      setLoading(true);
      setError("");

      const supabase = getSupabaseBrowserClient();
      const { people, totalCount: nextTotalCount } = await fetchRankedPeoplePage(
        supabase,
        {
          page,
          pageSize,
          search: debouncedQuery || undefined,
          sort
        }
      );

      if (!isActive) {
        return;
      }

      setResults(people);
      setTotalCount(nextTotalCount);
      setLoading(false);
    };

    void runSearch();

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, page, pageSize, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set("page", String(page));
    }

    router.replace(params.size > 0 ? `/search?${params.toString()}` : "/search", {
      scroll: false
    });
  }, [page, router]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const trimmedQuery = query.trim();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label htmlFor="search-people-query" className="block flex-1">
            <span className="mb-2 block text-sm font-medium text-zinc-100">
              Search by name
            </span>
            <input
              id="search-people-query"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search for Taylor, Dracula, your old roommate..."
              className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-accent"
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
                onChange={(event) => {
                  setSort(event.target.value as RankedPeopleSort);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white focus:border-accent"
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
              onClick={() => router.push(`/add?name=${encodeURIComponent(trimmedQuery)}`)}
              disabled={trimmedQuery.length === 0}
              className="self-end rounded-full border border-line bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add{trimmedQuery ? ` "${trimmedQuery}"` : ""}
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          Browse 8 people per page and jump to add flow when the right name is
          missing.
        </p>
      </div>

      <div className="min-h-6" aria-live="polite">
        {error ? (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            {loading
              ? "Updating results..."
              : `${totalCount} people found${totalCount > 0 ? ` · Page ${page} of ${totalPages}` : ""}`}
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-line bg-panel p-3">
        {loading && results.length === 0 ? (
          <div className="grid gap-3 p-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl border border-line bg-zinc-900"
              />
            ))}
          </div>
        ) : null}

        {!loading && results.length === 0 && !error ? (
          <div className="p-8 text-center text-zinc-300">
            {debouncedQuery.length > 0
              ? "No matches yet. Use the add action to create a new page."
              : "No ranked people yet. Add someone to start the list."}
          </div>
        ) : null}

        {results.length > 0 ? (
          <ul className="grid gap-3">
            {results.map((person) => (
              <PersonListItem key={person.id} person={person} />
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <p className="text-sm text-zinc-400">
          Page {page} of {totalPages}
        </p>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}

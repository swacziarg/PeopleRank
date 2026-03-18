import { SearchPeople } from "@/components/SearchPeople";
import { getRankedPeoplePage } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

type SearchPageProps = {
  searchParams?: {
    page?: string;
  };
};

const pageSize = 20;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const rankedPeoplePage = isSupabaseConfigured
    ? await getRankedPeoplePage({ page, pageSize })
    : { people: [], totalCount: 0 };

  return (
    <section className="space-y-6 py-8 sm:py-10">
      <div className="space-y-3 rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Search</p>
        <h1 className="text-3xl font-semibold text-white">
          Search and browse ranked people
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Browse the most engaged profiles, move page by page, or jump into the
          add flow with the current search term.
        </p>
      </div>
      <SearchPeople
        initialPeople={rankedPeoplePage.people}
        initialPage={page}
        initialTotalCount={rankedPeoplePage.totalCount}
        pageSize={pageSize}
      />
    </section>
  );
}

import { SearchPeople } from "@/components/SearchPeople";
import { getRankedPeoplePage } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SearchPageProps = {
  searchParams?: {
    page?: string;
    scope?: string;
    sort?: string;
  };
};

const pageSize = 8;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const addedByUserOnly = searchParams?.scope === "mine";
  const sort = searchParams?.sort;
  const supabase = isSupabaseConfigured ? await createSupabaseServerClient() : null;
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const rankedPeoplePage = isSupabaseConfigured
    ? await getRankedPeoplePage({
        page,
        pageSize,
        sort:
          sort === "most-commented" ||
          sort === "highest-rated" ||
          sort === "lowest-rated" ||
          sort === "newest" ||
          sort === "most-rated"
            ? sort
            : "most-rated",
        createdBy: addedByUserOnly && user ? user.id : undefined
      })
    : { people: [], totalCount: 0 };

  return (
    <section className="space-y-6 py-8 sm:py-10">
      <div className="space-y-3 rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
        <p className="max-w-2xl text-zinc-400">
          Browse ranked people by engagement.
        </p>
      </div>
      <SearchPeople
        initialPeople={rankedPeoplePage.people}
        initialPage={page}
        initialTotalCount={rankedPeoplePage.totalCount}
        initialSort={
          sort === "most-commented" ||
          sort === "highest-rated" ||
          sort === "lowest-rated" ||
          sort === "newest" ||
          sort === "most-rated"
            ? sort
            : "most-rated"
        }
        initialAddedByUserOnly={addedByUserOnly}
        pageSize={pageSize}
      />
    </section>
  );
}

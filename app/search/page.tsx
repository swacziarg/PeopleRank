import { SearchPeople } from "@/components/SearchPeople";
import { getRankedPeople } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function SearchPage() {
  const rankedPeople = isSupabaseConfigured ? await getRankedPeople() : [];

  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Search</p>
        <h1 className="text-3xl font-semibold text-white">
          Search and browse ranked people
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Browse the most engaged profiles by ratings and comments, or search by
          name to narrow the list.
        </p>
      </div>
      <SearchPeople initialPeople={rankedPeople} />
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { RatingCard } from "@/components/RatingCard";
import { getPersonById, getRatingsForPerson } from "@/lib/queries";
import { formatAverage } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

type PersonPageProps = {
  params: {
    id: string;
  };
};

export default async function PersonPage({ params }: PersonPageProps) {
  if (!isSupabaseConfigured) {
    return (
      <section className="py-10">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Supabase environment variables are missing. Configure `.env.local` to
          load person pages.
        </div>
      </section>
    );
  }

  const person = await getPersonById(params.id);

  if (!person) {
    notFound();
  }

  const ratings = await getRatingsForPerson(params.id);
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.stars, 0) / ratings.length
      : 0;

  return (
    <section className="space-y-8 py-10">
      <div className="rounded-[2rem] border border-line bg-panel/80 p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Person Page
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">{person.name}</h1>
            <p className="mt-2 text-zinc-400">
              Average rating:{" "}
              <span className="font-medium text-white">
                {formatAverage(average)}
              </span>{" "}
              from {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          <Link
            href={`/rate/${person.id}`}
            className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300"
          >
            Rate this person
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Ratings</h2>
        {ratings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-panel/70 p-8 text-center text-zinc-400">
            No public reviews yet. You could be first, which is a dangerous
            amount of influence.
          </div>
        ) : (
          ratings.map((rating) => (
            <RatingCard
              key={rating.id}
              personId={person.id}
              personName={person.name}
              stars={rating.stars}
              text={rating.text}
              createdAt={rating.createdAt}
              showPersonLink={false}
            />
          ))
        )}
      </div>
    </section>
  );
}

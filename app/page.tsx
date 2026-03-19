import Link from "next/link";
import { RatingLikeButton } from "@/components/RatingLikeButton";
import { RatingCard } from "@/components/RatingCard";
import { getLatestRatings } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function HomePage() {
  const supabase = isSupabaseConfigured ? await createSupabaseServerClient() : null;
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const ratings = isSupabaseConfigured ? await getLatestRatings(20, user?.id) : [];

  return (
    <section className="space-y-8 py-10">
      <div className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Public nonsense, elegantly presented
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Rate friends, villains, ex-coworkers, and imaginary legends.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
          PeopleRank is a deliberately unserious public board for star ratings
          and sharp one-liners. Browse the feed, add a person, or leave a
          diplomatic 2-star review.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/search"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300"
          >
            Search people
          </Link>
          <Link
            href="/add"
            className="rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-zinc-500"
          >
            Add a person
          </Link>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Supabase environment variables are missing. Add
          `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local` to
          load live data.
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Latest ratings</h2>
            <p className="text-sm text-zinc-400">
              The freshest public opinions, for better or worse.
            </p>
          </div>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded-3xl border border-line bg-panel p-8 text-center text-zinc-400">
            No ratings yet. Start the chaos by adding someone and leaving the
            first review.
          </div>
        ) : (
          <div className="grid gap-4">
            {ratings.map((rating) => (
              <RatingCard
                key={rating.id}
                ratingId={rating.id}
                personId={rating.personId}
                personName={rating.personName}
                authorName={rating.authorName}
                authorAvatarUrl={rating.authorAvatarUrl}
                authorAvatarLabel={rating.authorAvatarLabel}
                stars={rating.stars}
                text={rating.text}
                createdAt={rating.createdAt}
                likeControl={
                  <RatingLikeButton
                    ratingId={rating.id}
                    initialVoteScore={rating.voteScore}
                    initialUserVote={rating.currentUserVote}
                    initialCommentCount={rating.commentCount}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

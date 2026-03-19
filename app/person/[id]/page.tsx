import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BackButton } from "@/components/BackButton";
import { DeletePersonButton } from "@/components/DeletePersonButton";
import { EditPersonForm } from "@/components/EditPersonForm";
import { ManageRatingCard } from "@/components/ManageRatingCard";
import { RatingTrendChart } from "@/components/RatingTrendChart";
import { ShareButton } from "@/components/ShareButton";
import { getPersonById, getRatingsForPerson } from "@/lib/queries";
import { formatAverage } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const person = await getPersonById(params.id);

  if (!person) {
    notFound();
  }

  const ratings = await getRatingsForPerson(params.id, user?.id);
  const average =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.stars, 0) / ratings.length
      : 0;

  return (
    <section className="space-y-8 py-10">
      <BackButton fallbackHref="/search" />

      <div className="rounded-3xl border border-line bg-panel p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Person Page
        </p>
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar
                imageUrl={person.image_url}
                label={person.name}
                alt={`${person.name} avatar`}
                sizeClassName="h-20 w-20"
                textClassName="text-2xl"
              />
              <div>
                <h1 className="text-4xl font-semibold text-white">{person.name}</h1>
                {person.description?.trim() ? (
                  <p className="mt-3 max-w-2xl text-zinc-300">{person.description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ShareButton title={person.name} path={`/person/${person.id}`} />
              <Link
                href={`/rate/${person.id}`}
                className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300"
              >
                Rate this person
              </Link>
              {user?.id === person.created_by ? (
                <>
                  <EditPersonForm
                    personId={person.id}
                    initialName={person.name}
                    initialDescription={person.description ?? ""}
                    initialImageUrl={person.image_url ?? ""}
                  />
                  <DeletePersonButton personId={person.id} currentUserId={user.id} />
                </>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mt-2 text-zinc-400">
              Average rating:{" "}
              <span className="font-medium text-white">
                {formatAverage(average)}
              </span>{" "}
              from {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      <RatingTrendChart ratings={ratings} />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Ratings</h2>
        {ratings.length === 0 ? (
          <div className="rounded-3xl border border-line bg-panel p-8 text-center text-zinc-400">
            No public reviews yet. You could be first, which is a dangerous
            amount of influence.
          </div>
        ) : (
          ratings.map((rating) => (
            <ManageRatingCard
              key={rating.id}
              rating={rating}
              currentUserId={user?.id ?? null}
              showPersonLink={false}
            />
          ))
        )}
      </div>
    </section>
  );
}

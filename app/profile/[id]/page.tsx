import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ManageRatingCard } from "@/components/ManageRatingCard";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";
import { getDisplayNameFallback } from "@/lib/authProfile";
import { getProfileById, getRatingsByUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type PublicProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function PublicProfilePage({
  params
}: PublicProfilePageProps) {
  if (!isSupabaseConfigured) {
    return (
      <section className="py-10">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Supabase environment variables are missing. Configure `.env.local` to
          load profile data.
        </div>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user?.id === params.id) {
    redirect("/profile");
  }

  const [profile, ratings] = await Promise.all([
    getProfileById(params.id),
    getRatingsByUser(params.id, user?.id)
  ]);

  if (!profile) {
    notFound();
  }

  const displayName = getDisplayNameFallback(
    {
      email: undefined,
      user_metadata: {}
    },
    profile
  );
  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? ratings.reduce((sum, rating) => sum + rating.stars, 0) / totalRatings
      : 0;
  const totalComments = ratings.filter((rating) => rating.text.trim().length > 0).length;

  return (
    <section className="space-y-6 py-10">
      <BackButton fallbackHref="/" />

      <ProfileSummaryCard
        title={displayName}
        subtitle="Public profile details and ratings posted from this account."
        displayName={displayName}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        joinedAt={profile.created_at}
        totalRatings={totalRatings}
        averageRating={averageRating}
        totalComments={totalComments}
      />

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Ratings</h2>
          <p className="text-sm text-zinc-400">All public ratings by this user.</p>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded-3xl border border-line bg-panel p-8 text-center text-zinc-400">
            No public ratings yet.
          </div>
        ) : (
          ratings.map((rating) => (
            <ManageRatingCard
              key={rating.id}
              rating={rating}
              currentUserId={user?.id ?? null}
            />
          ))
        )}
      </div>
    </section>
  );
}

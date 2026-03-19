import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { BackButton } from "@/components/BackButton";
import { getRatingsByUser } from "@/lib/queries";
import { getDisplayNameFallback } from "@/lib/authProfile";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ManageRatingCard } from "@/components/ManageRatingCard";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";

export default async function ProfilePage() {
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
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <section className="py-10">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          Unable to load the current user session.
        </div>
      </section>
    );
  }

  const [{ data: profile, error: profileError }, ratings] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    getRatingsByUser(user.id, user.id)
  ]);

  const avatarUrl =
    typeof profile?.avatar_url === "string" && profile.avatar_url.trim()
      ? profile.avatar_url
      : typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : null;
  const displayName =
    getDisplayNameFallback(user, profile);
  const ratingList = ratings;
  const totalRatings = ratingList.length;
  const averageRating =
    totalRatings > 0
      ? ratingList.reduce((sum, rating) => sum + rating.stars, 0) / totalRatings
      : 0;
  const totalComments = ratingList.filter((rating) => rating.text.trim().length > 0).length;

  return (
    <section className="space-y-6 py-10">
      <BackButton fallbackHref="/" />

      <ProfileSummaryCard
        title="Your account"
        subtitle="Auth details, stored profile fields, and the ratings attached to your account."
        displayName={displayName}
        username={profile?.username || null}
        email={user.email || "Not available"}
        bio={profile?.bio || ""}
        userId={user.id}
        avatarUrl={avatarUrl}
        joinedAt={profile?.created_at || user.created_at}
        totalRatings={totalRatings}
        averageRating={averageRating}
        totalComments={totalComments}
        actions={
          <ProfileEditor
            userId={user.id}
            email={user.email || ""}
            createdAt={profile?.created_at || user.created_at}
            initialDisplayName={profile?.display_name || ""}
            initialBio={profile?.bio || ""}
            initialAvatarUrl={profile?.avatar_url || ""}
            initialUsername={profile?.username || ""}
          />
        }
      />

      {profileError ? (
        <p className="text-sm text-rose-300">{profileError.message}</p>
      ) : null}

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Your ratings</h2>
          <p className="text-sm text-zinc-400">
            Everything you have posted from this account.
          </p>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded-3xl border border-line bg-panel p-8 text-center text-zinc-400">
            You have not posted any ratings yet.
          </div>
        ) : null}

        {ratings.map((rating) => (
          <ManageRatingCard
            key={rating.id}
            rating={rating}
            currentUserId={user.id}
            showAuthor={false}
          />
        ))}
      </div>
    </section>
  );
}

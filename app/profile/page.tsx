import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Avatar } from "@/components/Avatar";
import { BackButton } from "@/components/BackButton";
import { getRatingsByUser } from "@/lib/queries";
import { getDisplayNameFallback } from "@/lib/authProfile";
import { formatDate, resolveAvatarLabel } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ManageRatingCard } from "@/components/ManageRatingCard";
import { ProfileEditor } from "@/components/ProfileEditor";

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
  const avatarLabel = resolveAvatarLabel(
    profile?.display_name,
    profile?.username,
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    user.email
  );
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

      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Profile</p>
        <h1 className="text-3xl font-semibold text-white">Your account</h1>
        <p className="max-w-2xl text-zinc-400">
          Auth details, stored profile fields, and the ratings attached to your
          account.
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-panel p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              imageUrl={avatarUrl}
              label={avatarLabel}
              alt="Profile avatar"
              sizeClassName="h-16 w-16"
              textClassName="text-xl"
            />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {displayName}
              </h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3">
            <ProfileEditor
              userId={user.id}
              email={user.email || ""}
              createdAt={profile?.created_at || user.created_at}
              initialDisplayName={profile?.display_name || ""}
              initialBio={profile?.bio || ""}
              initialAvatarUrl={profile?.avatar_url || ""}
              initialUsername={profile?.username || ""}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Ratings given
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalRatings}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Average rating
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {totalRatings > 0 ? averageRating.toFixed(1) : "0.0"}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Comments written
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalComments}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <p className="mt-2 text-sm text-white">{user.email || "Not available"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">User ID</p>
            <p className="mt-2 break-all text-sm text-white">{user.id}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Joined</p>
            <p className="mt-2 text-sm text-white">{formatDate(user.created_at)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Display name</p>
            <p className="mt-2 text-sm text-white">{displayName}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Bio</p>
            <p className="mt-2 text-sm text-white">
              {profile?.bio?.trim() || "No bio saved yet"}
            </p>
          </div>
        </div>

        {profileError ? (
          <p className="mt-4 text-sm text-rose-300">{profileError.message}</p>
        ) : null}
      </div>

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

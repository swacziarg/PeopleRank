import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatDate, getInitials } from "@/lib/utils";
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

  const [{ data: profile, error: profileError }, { data: ratings, error: ratingsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("ratings")
        .select(
          "id, user_id, stars, text, created_at, people!inner(id, name), profiles!ratings_user_id_fkey(display_name, avatar_url, username)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
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
    profile?.display_name?.trim() ||
    profile?.username ||
    user.user_metadata?.username ||
    user.email ||
    "No name set";
  const initials = getInitials(displayName);

  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Profile</p>
        <h1 className="text-3xl font-semibold text-white">Your account</h1>
        <p className="max-w-2xl text-zinc-400">
          Auth details, stored profile fields, and the ratings attached to your
          account.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="h-16 w-16 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-black/20 text-xl font-semibold text-accent">
                {initials}
              </div>
            )}
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <p className="mt-2 text-sm text-white">{user.email || "Not available"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">User ID</p>
            <p className="mt-2 break-all text-sm text-white">{user.id}</p>
          </div>
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Joined</p>
            <p className="mt-2 text-sm text-white">{formatDate(user.created_at)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Display name</p>
            <p className="mt-2 text-sm text-white">{displayName}</p>
          </div>
          <div className="rounded-2xl border border-line bg-black/20 p-4">
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

        {ratingsError ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
            {ratingsError.message}
          </div>
        ) : null}

        {!ratingsError && (!ratings || ratings.length === 0) ? (
          <div className="rounded-3xl border border-dashed border-line bg-panel/70 p-8 text-center text-zinc-400">
            You have not posted any ratings yet.
          </div>
        ) : null}

        {ratings?.map((rating) => (
          <ManageRatingCard
            key={rating.id}
            rating={{
              id: rating.id,
              userId: rating.user_id,
              personId: rating.people.id,
              personName: rating.people.name,
              authorName:
                rating.profiles?.display_name?.trim() ||
                user.email ||
                rating.profiles?.username?.trim() ||
                "Unknown user",
              authorAvatarUrl: rating.profiles?.avatar_url ?? null,
              stars: rating.stars,
              text: rating.text,
              createdAt: rating.created_at
            }}
            currentUserId={user.id}
            showAuthor={false}
          />
        ))}
      </div>
    </section>
  );
}

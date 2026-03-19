import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ProfileSummary = {
  display_name?: string | null;
  username?: string | null;
};

function sanitizeUsername(value: string) {
  return value.trim().replace(/\s+/g, "-").slice(0, 40);
}

export function getFallbackUsername(
  user: User,
  preferredUsername?: string | null
) {
  const metadataUsername =
    typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user.user_metadata?.user_name === "string"
        ? user.user_metadata.user_name
        : null;
  const emailPrefix = user.email?.split("@")[0] ?? null;

  return (
    sanitizeUsername(preferredUsername ?? "") ||
    sanitizeUsername(metadataUsername ?? "") ||
    sanitizeUsername(emailPrefix ?? "") ||
    `user-${user.id.slice(0, 8)}`
  );
}

export function getDisplayNameFallback(
  user: Pick<User, "email" | "user_metadata">,
  profile?: ProfileSummary | null
) {
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null;
  const metadataUsername =
    typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username
      : null;

  return (
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    metadataDisplayName?.trim() ||
    metadataUsername?.trim() ||
    user.email?.trim() ||
    "Anonymous"
  );
}

export async function getAuthenticatedUser(
  client: SupabaseClient<Database>
): Promise<User | null> {
  const {
    data: { session }
  } = await client.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const {
    data: { user }
  } = await client.auth.getUser();

  return user;
}

export async function ensureProfileForUser(
  client: SupabaseClient<Database>,
  user: User,
  preferredUsername?: string | null
) {
  const primaryUsername = getFallbackUsername(user, preferredUsername);
  const fallbackUsername = `user-${user.id.slice(0, 8)}`;

  const tryInsert = async (username: string) =>
    client.from("profiles").upsert(
      {
        id: user.id,
        username
      },
      {
        onConflict: "id",
        ignoreDuplicates: true
      }
    );

  const firstAttempt = await tryInsert(primaryUsername);

  if (
    firstAttempt.error?.code === "23505" &&
    primaryUsername !== fallbackUsername
  ) {
    return tryInsert(fallbackUsername);
  }

  return firstAttempt;
}

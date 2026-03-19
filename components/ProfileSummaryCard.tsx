import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { formatDate, resolveAvatarLabel } from "@/lib/utils";

type ProfileSummaryCardProps = {
  title: string;
  subtitle: string;
  displayName: string;
  username?: string | null;
  email?: string | null;
  bio?: string | null;
  userId?: string | null;
  avatarUrl?: string | null;
  joinedAt: string;
  totalRatings: number;
  averageRating: number;
  totalComments: number;
  actions?: ReactNode;
};

export function ProfileSummaryCard({
  title,
  subtitle,
  displayName,
  username,
  email,
  bio,
  userId,
  avatarUrl,
  joinedAt,
  totalRatings,
  averageRating,
  totalComments,
  actions
}: ProfileSummaryCardProps) {
  const avatarLabel = resolveAvatarLabel(displayName, username, email);

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Profile</p>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="max-w-2xl text-zinc-400">{subtitle}</p>
      </div>

      <div className="rounded-3xl border border-line bg-panel p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              imageUrl={avatarUrl}
              label={avatarLabel}
              alt={`${displayName} avatar`}
              sizeClassName="h-16 w-16"
              textClassName="text-xl"
            />
            <div>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              {username?.trim() ? (
                <p className="text-sm text-zinc-400">@{username.trim()}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-col items-start gap-3">{actions}</div> : null}
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
          {email ? (
            <div className="rounded-2xl border border-line bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
              <p className="mt-2 text-sm text-white">{email}</p>
            </div>
          ) : null}
          {userId ? (
            <div className="rounded-2xl border border-line bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">User ID</p>
              <p className="mt-2 break-all text-sm text-white">{userId}</p>
            </div>
          ) : null}
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Joined</p>
            <p className="mt-2 text-sm text-white">{formatDate(joinedAt)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Display name</p>
            <p className="mt-2 text-sm text-white">{displayName}</p>
          </div>
          <div className="rounded-2xl border border-line bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Bio</p>
            <p className="mt-2 text-sm text-white">
              {bio?.trim() || "No bio saved yet"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

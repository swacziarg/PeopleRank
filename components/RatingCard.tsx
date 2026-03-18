import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { formatDate, renderStars } from "@/lib/utils";

type RatingCardProps = {
  personId: string;
  personName: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorAvatarLabel?: string | null;
  stars: number;
  text: string;
  createdAt: string;
  showPersonLink?: boolean;
  showAuthor?: boolean;
  likeControl?: ReactNode;
  actions?: ReactNode;
};

export function RatingCard({
  personId,
  personName,
  authorName,
  authorAvatarUrl,
  authorAvatarLabel,
  stars,
  text,
  createdAt,
  showPersonLink = true,
  showAuthor = true,
  likeControl,
  actions
}: RatingCardProps) {
  const comment = text.trim();

  return (
    <article className="rounded-3xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {showPersonLink ? (
            <Link
              href={`/person/${personId}`}
              className="text-lg font-semibold text-white hover:text-accent"
            >
              {personName}
            </Link>
          ) : (
            <h3 className="text-lg font-semibold text-white">{personName}</h3>
          )}
          <p className="text-lg text-accent">{renderStars(stars)}</p>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          {formatDate(createdAt)}
        </p>
      </div>
      {showAuthor ? (
        <div className="mt-4 flex items-center gap-3">
          <Avatar
            imageUrl={authorAvatarUrl}
            label={authorAvatarLabel}
            alt={`${authorName} avatar`}
            sizeClassName="h-8 w-8"
            textClassName="text-xs"
          />
          <p className="text-sm font-medium text-zinc-200">{authorName}</p>
        </div>
      ) : null}
      {comment ? <p className="mt-4 text-zinc-300">{comment}</p> : null}
      {likeControl ? <div className="mt-4">{likeControl}</div> : null}
      {actions ? <div className="mt-4">{actions}</div> : null}
    </article>
  );
}

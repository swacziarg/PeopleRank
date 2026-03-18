import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate, getInitials, renderStars } from "@/lib/utils";

type RatingCardProps = {
  personId: string;
  personName: string;
  authorName: string;
  authorAvatarUrl: string | null;
  stars: number;
  text: string;
  createdAt: string;
  showPersonLink?: boolean;
  showAuthor?: boolean;
  actions?: ReactNode;
};

export function RatingCard({
  personId,
  personName,
  authorName,
  authorAvatarUrl,
  stars,
  text,
  createdAt,
  showPersonLink = true,
  showAuthor = true,
  actions
}: RatingCardProps) {
  const initials = getInitials(authorName);
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
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt={`${authorName} avatar`}
              className="h-8 w-8 rounded-full border border-line object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-zinc-900 text-xs font-semibold text-accent">
              {initials}
            </div>
          )}
          <p className="text-sm font-medium text-zinc-200">{authorName}</p>
        </div>
      ) : null}
      {comment ? <p className="mt-4 text-zinc-300">{comment}</p> : null}
      {actions ? <div className="mt-4">{actions}</div> : null}
    </article>
  );
}

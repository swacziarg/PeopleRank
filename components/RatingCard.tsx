import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate, renderStars } from "@/lib/utils";

type RatingCardProps = {
  personId: string;
  personName: string;
  stars: number;
  text: string;
  createdAt: string;
  showPersonLink?: boolean;
  actions?: ReactNode;
};

export function RatingCard({
  personId,
  personName,
  stars,
  text,
  createdAt,
  showPersonLink = true,
  actions
}: RatingCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-line bg-panel/80 p-5 shadow-glow">
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
      <p className="mt-4 text-zinc-300">{text}</p>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </article>
  );
}

import Link from "next/link";
import { formatAverage, getInitials } from "@/lib/utils";
import type { RankedPerson } from "@/types";

type PersonListItemProps = {
  person: RankedPerson;
};

export function PersonListItem({ person }: PersonListItemProps) {
  return (
    <li>
      <article className="flex flex-col gap-4 rounded-[1.5rem] border border-line bg-panel/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {person.avatarUrl ? (
            <img
              src={person.avatarUrl}
              alt={`${person.name} avatar`}
              className="h-14 w-14 rounded-full border border-line object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-black/20 text-sm font-semibold text-accent"
            >
              {getInitials(person.name)}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{person.name}</h2>
              <span className="rounded-full bg-accentSoft px-2.5 py-1 text-xs font-medium text-accent">
                Rank #{person.rank}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
              <span className="rounded-full border border-line bg-black/20 px-3 py-1">
                {person.ratingCount} ratings
              </span>
              <span className="rounded-full border border-line bg-black/20 px-3 py-1">
                {person.commentCount} comments
              </span>
              <span className="rounded-full border border-line bg-black/20 px-3 py-1">
                Score {person.engagementScore}
              </span>
              <span className="rounded-full border border-line bg-black/20 px-3 py-1">
                Avg {formatAverage(person.averageStars)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/person/${person.id}`}
            aria-label={`View ${person.name}`}
            className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-white hover:border-zinc-500 hover:bg-white/10"
          >
            View
          </Link>
          <Link
            href={`/rate/${person.id}`}
            aria-label={`Rate ${person.name}`}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-amber-300"
          >
            Rate
          </Link>
        </div>
      </article>
    </li>
  );
}

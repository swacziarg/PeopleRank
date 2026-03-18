import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { formatAverage } from "@/lib/utils";
import type { RankedPerson } from "@/types";

type PersonListItemProps = {
  person: RankedPerson;
};

export function PersonListItem({ person }: PersonListItemProps) {
  return (
    <li>
      <article className="flex flex-col gap-4 rounded-3xl border border-line bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            imageUrl={person.avatarUrl}
            label={person.name}
            alt={`${person.name} avatar`}
            sizeClassName="h-14 w-14"
            textClassName="text-sm"
          />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{person.name}</h2>
              {person.rank !== null ? (
                <span className="rounded-full border border-line bg-zinc-900 px-2.5 py-1 text-xs font-medium text-accent">
                  Rank #{person.rank}
                </span>
              ) : null}
            </div>

            {person.description?.trim() ? (
              <p className="max-w-2xl text-sm text-zinc-400">{person.description}</p>
            ) : null}

            <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
              <span className="rounded-full border border-line bg-zinc-900 px-3 py-1">
                {person.ratingCount} ratings
              </span>
              <span className="rounded-full border border-line bg-zinc-900 px-3 py-1">
                {person.commentCount} comments
              </span>
              <span className="rounded-full border border-line bg-zinc-900 px-3 py-1">
                Score {person.engagementScore}
              </span>
              <span className="rounded-full border border-line bg-zinc-900 px-3 py-1">
                Avg {formatAverage(person.averageStars)}
              </span>
              {person.lowestStars !== null ? (
                <span className="rounded-full border border-line bg-zinc-900 px-3 py-1">
                  Lowest: {person.lowestStars}★
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/person/${person.id}`}
            aria-label={`View ${person.name}`}
            className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500"
          >
            View
          </Link>
          <Link
            href={`/rate/${person.id}`}
            aria-label={`Rate ${person.name}`}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-amber-300"
          >
            Rate
          </Link>
        </div>
      </article>
    </li>
  );
}

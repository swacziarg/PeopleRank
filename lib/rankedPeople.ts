import type { SupabaseClient } from "@supabase/supabase-js";
import type { RankedPerson } from "@/types";
import type { Database } from "@/types/database";

type PersonRow = Pick<Database["public"]["Tables"]["people"]["Row"], "id" | "name" | "created_at">;

type RankedPersonBase = Omit<RankedPerson, "rank">;

type AggregateRow = {
  person_id: string;
  count: number | string | null;
  average_stars?: number | string | null;
};

export type RankedPeopleSort =
  | "most-rated"
  | "most-commented"
  | "highest-rated"
  | "newest";

const defaultLimit = 50;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function compareRankedPeople(
  left: RankedPersonBase,
  right: RankedPersonBase,
  sort: RankedPeopleSort
) {
  if (sort === "most-commented") {
    if (right.commentCount !== left.commentCount) {
      return right.commentCount - left.commentCount;
    }
  }

  if (sort === "highest-rated") {
    if (right.averageStars !== left.averageStars) {
      return right.averageStars - left.averageStars;
    }

    if (right.ratingCount !== left.ratingCount) {
      return right.ratingCount - left.ratingCount;
    }
  }

  if (sort === "newest") {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }
  }

  if (right.ratingCount !== left.ratingCount) {
    return right.ratingCount - left.ratingCount;
  }

  if (right.commentCount !== left.commentCount) {
    return right.commentCount - left.commentCount;
  }

  if (right.averageStars !== left.averageStars) {
    return right.averageStars - left.averageStars;
  }

  return left.name.localeCompare(right.name);
}

export function sortRankedPeople(
  people: RankedPersonBase[],
  sort: RankedPeopleSort
): RankedPerson[] {
  return [...people]
    .sort((left, right) => compareRankedPeople(left, right, sort))
    .map((person, index) => ({
      ...person,
      rank: index + 1
    }));
}

export function createRankedPerson(person: PersonRow): RankedPersonBase {
  return {
    id: person.id,
    name: person.name,
    createdAt: person.created_at,
    avatarUrl: null,
    ratingCount: 0,
    commentCount: 0,
    averageStars: 0,
    engagementScore: 0
  };
}

function buildRankedPeople(
  people: PersonRow[],
  ratingRows: AggregateRow[],
  commentRows: AggregateRow[],
  sort: RankedPeopleSort
) {
  const ratingMap = new Map(
    ratingRows.map((row) => [
      row.person_id,
      {
        ratingCount: toNumber(row.count),
        averageStars: toNumber(row.average_stars)
      }
    ])
  );

  const commentMap = new Map(
    commentRows.map((row) => [row.person_id, toNumber(row.count)])
  );

  const rankedBase = people.map((person) => {
    const ratingStats = ratingMap.get(person.id);
    const ratingCount = ratingStats?.ratingCount ?? 0;
    const commentCount = commentMap.get(person.id) ?? 0;
    const averageStars = ratingStats?.averageStars ?? 0;

    return {
      ...createRankedPerson(person),
      ratingCount,
      commentCount,
      averageStars,
      engagementScore: ratingCount + commentCount
    };
  });

  return sortRankedPeople(rankedBase, sort);
}

async function fetchRatingAggregates(
  client: SupabaseClient<Database>,
  personIds: string[]
) {
  const ratingQuery = client
    .from("ratings")
    .select("person_id, count:id.count(), average_stars:stars.avg()")
    .in("person_id", personIds);
  const commentQuery = client
    .from("ratings")
    .select("person_id, count:id.count()")
    .in("person_id", personIds)
    .not("text", "eq", "");

  const [{ data: ratingRows, error: ratingError }, { data: commentRows, error: commentError }] =
    await Promise.all([ratingQuery, commentQuery]);

  if (ratingError || commentError) {
    return null;
  }

  return {
    ratingRows: (ratingRows ?? []) as AggregateRow[],
    commentRows: (commentRows ?? []) as AggregateRow[]
  };
}

async function fetchRatingAggregatesFallback(
  client: SupabaseClient<Database>,
  personIds: string[]
) {
  const ratingRowsQuery = client
    .from("ratings")
    .select("person_id, stars")
    .in("person_id", personIds);
  const commentRowsQuery = client
    .from("ratings")
    .select("person_id")
    .in("person_id", personIds)
    .not("text", "eq", "");

  const [{ data: ratingRows, error: ratingsError }, { data: commentRows, error: commentsError }] =
    await Promise.all([ratingRowsQuery, commentRowsQuery]);

  if (ratingsError || commentsError) {
    return null;
  }

  const ratingMap = new Map<string, { count: number; totalStars: number }>();
  for (const row of ratingRows ?? []) {
    const current = ratingMap.get(row.person_id) ?? { count: 0, totalStars: 0 };
    current.count += 1;
    current.totalStars += row.stars;
    ratingMap.set(row.person_id, current);
  }

  const commentMap = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentMap.set(row.person_id, (commentMap.get(row.person_id) ?? 0) + 1);
  }

  return {
    ratingRows: [...ratingMap.entries()].map(([person_id, stats]) => ({
      person_id,
      count: stats.count,
      average_stars: stats.count > 0 ? stats.totalStars / stats.count : 0
    })),
    commentRows: [...commentMap.entries()].map(([person_id, count]) => ({
      person_id,
      count
    }))
  };
}

export async function fetchRankedPeople(
  client: SupabaseClient<Database>,
  {
    limit = defaultLimit,
    search,
    sort = "most-rated"
  }: {
    limit?: number;
    search?: string;
    sort?: RankedPeopleSort;
  } = {}
) {
  let query = client.from("people").select("id, name, created_at");

  if (search) {
    query = query.ilike("name", `%${search}%`).limit(limit);
  }

  const { data: people, error } = await query;

  if (error || !people?.length) {
    return [];
  }

  const personIds = people.map((person) => person.id);
  const aggregateData =
    (await fetchRatingAggregates(client, personIds)) ??
    (await fetchRatingAggregatesFallback(client, personIds));

  if (!aggregateData) {
    return sortRankedPeople(people.map((person) => createRankedPerson(person)), sort).slice(
      0,
      limit
    );
  }

  return buildRankedPeople(
    people,
    aggregateData.ratingRows,
    aggregateData.commentRows,
    sort
  ).slice(0, limit);
}

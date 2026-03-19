import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanPersonName, normalizePersonName } from "@/lib/utils";
import type { RankedPerson } from "@/types";
import type { Database } from "@/types/database";

export type RankedPeopleSort =
  | "most-rated"
  | "most-commented"
  | "highest-rated"
  | "lowest-rated"
  | "newest";

export type RankedPeoplePageResult = {
  people: RankedPerson[];
  totalCount: number;
};

export type RankedPeopleSearchResult = RankedPeoplePageResult & {
  hasExactMatches: boolean;
  similarPeople: RankedPerson[];
};

type RankedPeopleRow = Database["public"]["Functions"]["get_ranked_people_page"]["Returns"][number];
type PersonWithRatingsRow = Database["public"]["Tables"]["people"]["Row"] & {
  ratings: Pick<Database["public"]["Tables"]["ratings"]["Row"], "stars" | "text">[] | null;
};

function toRankedPerson(row: RankedPeopleRow): RankedPerson {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    avatarUrl: row.image_url,
    description: null,
    ratingCount: Number(row.rating_count) || 0,
    commentCount: Number(row.comment_count) || 0,
    averageStars: Number(row.average_stars) || 0,
    lowestStars:
      row.lowest_stars === null || row.lowest_stars === undefined
        ? null
        : Number(row.lowest_stars),
    engagementScore: Number(row.engagement_score) || 0,
    rank: Number(row.rank) || null
  };
}

function toRankedPersonFromPeopleRow(row: PersonWithRatingsRow): RankedPerson {
  const ratings = row.ratings ?? [];
  const ratingCount = ratings.length;
  const commentCount = ratings.filter(
    (rating) => rating.text?.trim().length > 0
  ).length;
  const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
  const averageStars = ratingCount > 0 ? totalStars / ratingCount : 0;
  const lowestStars =
    ratingCount > 0 ? Math.min(...ratings.map((rating) => rating.stars)) : null;

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    avatarUrl: row.image_url,
    description: row.description,
    ratingCount,
    commentCount,
    averageStars,
    lowestStars,
    engagementScore: ratingCount + commentCount,
    rank: null
  };
}

function compareRankedPeople(sort: RankedPeopleSort) {
  return (left: RankedPerson, right: RankedPerson) => {
    const highestRatedDelta = right.averageStars - left.averageStars;
    const leftLowestStars = left.lowestStars ?? Number.POSITIVE_INFINITY;
    const rightLowestStars = right.lowestStars ?? Number.POSITIVE_INFINITY;
    const lowestRatedDelta =
      leftLowestStars === rightLowestStars ? 0 : leftLowestStars - rightLowestStars;
    const newestDelta =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    const mostCommentedDelta = right.commentCount - left.commentCount;
    const mostRatedDelta = right.ratingCount - left.ratingCount;

    if (sort === "highest-rated" && highestRatedDelta !== 0) {
      return highestRatedDelta;
    }

    if (sort === "lowest-rated" && lowestRatedDelta !== 0) {
      return lowestRatedDelta;
    }

    if (sort === "newest" && newestDelta !== 0) {
      return newestDelta;
    }

    if (sort === "most-commented" && mostCommentedDelta !== 0) {
      return mostCommentedDelta;
    }

    if (sort === "most-rated" && mostRatedDelta !== 0) {
      return mostRatedDelta;
    }

    if (mostRatedDelta !== 0) {
      return mostRatedDelta;
    }

    if (mostCommentedDelta !== 0) {
      return mostCommentedDelta;
    }

    if (highestRatedDelta !== 0) {
      return highestRatedDelta;
    }

    if (lowestRatedDelta !== 0) {
      return lowestRatedDelta;
    }

    if (newestDelta !== 0) {
      return newestDelta;
    }

    return left.name.localeCompare(right.name);
  };
}

async function fetchPeopleWithRatings(
  client: SupabaseClient<Database>,
  {
    query,
    exact,
    limit,
    createdBy
  }: {
    query: string;
    exact: boolean;
    limit: number;
    createdBy?: string;
  }
) {
  const baseQuery = client
    .from("people")
    .select(
      "id, name, created_at, created_by, description, image_url, normalized_name, ratings(stars, text)"
    )
    .limit(limit);

  let queryBuilder = exact
    ? baseQuery.eq("normalized_name", normalizePersonName(query))
    : baseQuery.ilike("name", `%${cleanPersonName(query)}%`);

  if (createdBy) {
    queryBuilder = queryBuilder.eq("created_by", createdBy);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    return [];
  }

  return (data as PersonWithRatingsRow[]).map(toRankedPersonFromPeopleRow);
}

export async function fetchRankedPeoplePage(
  client: SupabaseClient<Database>,
  {
    page = 1,
    pageSize = 8,
    search,
    sort = "most-rated",
    createdBy
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: RankedPeopleSort;
    createdBy?: string;
  } = {}
): Promise<RankedPeoplePageResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const normalizedSearch = search?.trim() ? search.trim() : null;

  const { data, error } = await client.rpc("get_ranked_people_page", {
    created_by_filter: createdBy ?? null,
    page_number: safePage,
    page_size: safePageSize,
    search_term: normalizedSearch,
    sort_by: sort
  });

  if (error || !data) {
    return {
      people: [],
      totalCount: 0
    };
  }

  return {
    people: data.map(toRankedPerson),
    totalCount: Number(data[0]?.total_count) || 0
  };
}

export async function fetchSearchPeople(
  client: SupabaseClient<Database>,
  {
    pageSize = 8,
    query,
    sort = "most-rated",
    createdBy
  }: {
    pageSize?: number;
    query: string;
    sort?: RankedPeopleSort;
    createdBy?: string;
  }
): Promise<RankedPeopleSearchResult> {
  const exactPeople = await fetchPeopleWithRatings(client, {
    query,
    exact: true,
    limit: pageSize,
    createdBy
  });

  if (exactPeople.length > 0) {
    return {
      people: exactPeople.sort(compareRankedPeople(sort)),
      totalCount: exactPeople.length,
      hasExactMatches: true,
      similarPeople: []
    };
  }

  const similarPeople = await fetchPeopleWithRatings(client, {
    query,
    exact: false,
    limit: pageSize,
    createdBy
  });

  return {
    people: [],
    totalCount: 0,
    hasExactMatches: false,
    similarPeople: similarPeople.sort(compareRankedPeople(sort))
  };
}

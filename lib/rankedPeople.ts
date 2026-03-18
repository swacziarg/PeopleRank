import type { SupabaseClient } from "@supabase/supabase-js";
import type { RankedPerson } from "@/types";
import type { Database } from "@/types/database";

export type RankedPeopleSort =
  | "most-rated"
  | "most-commented"
  | "highest-rated"
  | "newest";

export type RankedPeoplePageResult = {
  people: RankedPerson[];
  totalCount: number;
};

type RankedPeopleRow = Database["public"]["Functions"]["get_ranked_people_page"]["Returns"][number];

function toRankedPerson(row: RankedPeopleRow): RankedPerson {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    avatarUrl: null,
    ratingCount: Number(row.rating_count) || 0,
    commentCount: Number(row.comment_count) || 0,
    averageStars: Number(row.average_stars) || 0,
    engagementScore: Number(row.engagement_score) || 0,
    rank: Number(row.rank) || 0
  };
}

export async function fetchRankedPeoplePage(
  client: SupabaseClient<Database>,
  {
    page = 1,
    pageSize = 8,
    search,
    sort = "most-rated"
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: RankedPeopleSort;
  } = {}
): Promise<RankedPeoplePageResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const normalizedSearch = search?.trim() ? search.trim() : null;

  const { data, error } = await client.rpc("get_ranked_people_page", {
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

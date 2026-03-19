import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getDisplayNameFallback } from "@/lib/authProfile";
import {
  fetchRankedPeoplePage,
  type RankedPeoplePageResult,
  type RankedPeopleSort
} from "@/lib/rankedPeople";
import type { FeedRating, PersonDetail } from "@/types";

type ProfileSummary = {
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
};

type LatestRatingRow = {
  id: string;
  user_id: string;
  stars: number;
  text: string;
  created_at: string;
  people: {
    id: string;
    name: string;
  };
  profiles: ProfileSummary | null;
};

type PersonRatingRow = {
  id: string;
  user_id: string;
  stars: number;
  text: string;
  created_at: string;
  people: {
    name: string;
  };
  profiles: ProfileSummary | null;
};

type RatingLikeMaps = {
  likedRatingIds: Set<string>;
  likeCountByRatingId: Map<string, number>;
};

async function getRatingLikeMaps(
  ratingIds: string[],
  currentUserId?: string | null
): Promise<RatingLikeMaps> {
  if (ratingIds.length === 0) {
    return {
      likedRatingIds: new Set<string>(),
      likeCountByRatingId: new Map<string, number>()
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rating_likes")
    .select("rating_id, user_id")
    .in("rating_id", ratingIds);

  if (error || !data) {
    return {
      likedRatingIds: new Set<string>(),
      likeCountByRatingId: new Map<string, number>()
    };
  }

  const likedRatingIds = new Set<string>();
  const likeCountByRatingId = new Map<string, number>();

  for (const like of data) {
    likeCountByRatingId.set(
      like.rating_id,
      (likeCountByRatingId.get(like.rating_id) ?? 0) + 1
    );

    if (currentUserId && like.user_id === currentUserId) {
      likedRatingIds.add(like.rating_id);
    }
  }

  return {
    likedRatingIds,
    likeCountByRatingId
  };
}

function toFeedRating(
  item: {
    id: string;
    user_id: string;
    stars: number;
    text: string;
    created_at: string;
    profiles: ProfileSummary | null;
  },
  {
    personId,
    personName,
    likedRatingIds,
    likeCountByRatingId
  }: {
    personId: string;
    personName: string;
    likedRatingIds: Set<string>;
    likeCountByRatingId: Map<string, number>;
  }
): FeedRating {
  const authorName = getDisplayNameFallback(
    {
      email: undefined,
      user_metadata: {}
    },
    item.profiles
  );

  return {
    id: item.id,
    userId: item.user_id,
    authorName,
    authorAvatarUrl: item.profiles?.avatar_url ?? null,
    authorAvatarLabel: authorName,
    stars: item.stars,
    text: item.text ?? "",
    createdAt: item.created_at,
    personId,
    personName,
    likeCount: likeCountByRatingId.get(item.id) ?? 0,
    likedByCurrentUser: likedRatingIds.has(item.id)
  };
}

export async function getLatestRatings(
  limit = 20,
  currentUserId?: string | null
): Promise<FeedRating[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select(
      "id, user_id, stars, text, created_at, people!inner(id, name), profiles!ratings_user_id_fkey(display_name, avatar_url, username)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const ratingRows = data as LatestRatingRow[];
  const { likedRatingIds, likeCountByRatingId } = await getRatingLikeMaps(
    ratingRows.map((item) => item.id),
    currentUserId
  );

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId: item.people.id,
      personName: item.people.name,
      likedRatingIds,
      likeCountByRatingId
    })
  );
}

export async function getRatingsForPerson(
  personId: string,
  currentUserId?: string | null
): Promise<FeedRating[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select(
      "id, user_id, stars, text, created_at, people!inner(name), profiles!ratings_user_id_fkey(display_name, avatar_url, username)"
    )
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const ratingRows = data as PersonRatingRow[];
  const { likedRatingIds, likeCountByRatingId } = await getRatingLikeMaps(
    ratingRows.map((item) => item.id),
    currentUserId
  );

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId,
      personName: item.people.name,
      likedRatingIds,
      likeCountByRatingId
    })
  );
}

export async function getRatingsByUser(
  userId: string,
  currentUserId?: string | null
): Promise<FeedRating[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select(
      "id, user_id, stars, text, created_at, people!inner(id, name), profiles!ratings_user_id_fkey(display_name, avatar_url, username)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const ratingRows = data as LatestRatingRow[];
  const { likedRatingIds, likeCountByRatingId } = await getRatingLikeMaps(
    ratingRows.map((item) => item.id),
    currentUserId
  );

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId: item.people.id,
      personName: item.people.name,
      likedRatingIds,
      likeCountByRatingId
    })
  );
}

export async function getPersonById(id: string): Promise<PersonDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name, created_at, created_by, description, image_url")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getRankedPeoplePage({
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
} = {}): Promise<RankedPeoplePageResult> {
  const supabase = await createSupabaseServerClient();
  return fetchRankedPeoplePage(supabase, {
    page,
    pageSize,
    search,
    sort,
    createdBy
  });
}

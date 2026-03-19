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

type RatingVoteMaps = {
  currentUserVoteByRatingId: Map<string, -1 | 1>;
  voteScoreByRatingId: Map<string, number>;
};

type RatingCommentCounts = Map<string, number>;

async function getRatingVoteMaps(
  ratingIds: string[],
  currentUserId?: string | null
): Promise<RatingVoteMaps> {
  if (ratingIds.length === 0) {
    return {
      currentUserVoteByRatingId: new Map<string, -1 | 1>(),
      voteScoreByRatingId: new Map<string, number>()
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rating_votes")
    .select("rating_id, user_id, value")
    .in("rating_id", ratingIds);

  if (error || !data) {
    return {
      currentUserVoteByRatingId: new Map<string, -1 | 1>(),
      voteScoreByRatingId: new Map<string, number>()
    };
  }

  const currentUserVoteByRatingId = new Map<string, -1 | 1>();
  const voteScoreByRatingId = new Map<string, number>();

  for (const vote of data) {
    voteScoreByRatingId.set(
      vote.rating_id,
      (voteScoreByRatingId.get(vote.rating_id) ?? 0) + vote.value
    );

    if (
      currentUserId &&
      vote.user_id === currentUserId &&
      (vote.value === 1 || vote.value === -1)
    ) {
      currentUserVoteByRatingId.set(vote.rating_id, vote.value);
    }
  }

  return {
    currentUserVoteByRatingId,
    voteScoreByRatingId
  };
}

async function getRatingCommentCounts(
  ratingIds: string[]
): Promise<RatingCommentCounts> {
  if (ratingIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rating_comments")
    .select("rating_id")
    .in("rating_id", ratingIds);

  if (error || !data) {
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();

  for (const comment of data) {
    if (!comment.rating_id) {
      continue;
    }

    counts.set(comment.rating_id, (counts.get(comment.rating_id) ?? 0) + 1);
  }

  return counts;
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
    currentUserVoteByRatingId,
    voteScoreByRatingId,
    commentCountByRatingId
  }: {
    personId: string;
    personName: string;
    currentUserVoteByRatingId: Map<string, -1 | 1>;
    voteScoreByRatingId: Map<string, number>;
    commentCountByRatingId: RatingCommentCounts;
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
    voteScore: voteScoreByRatingId.get(item.id) ?? 0,
    currentUserVote: currentUserVoteByRatingId.get(item.id) ?? 0,
    commentCount: commentCountByRatingId.get(item.id) ?? 0
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
  const ratingIds = ratingRows.map((item) => item.id);
  const [voteMaps, commentCountByRatingId] = await Promise.all([
    getRatingVoteMaps(ratingIds, currentUserId),
    getRatingCommentCounts(ratingIds)
  ]);

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId: item.people.id,
      personName: item.people.name,
      currentUserVoteByRatingId: voteMaps.currentUserVoteByRatingId,
      voteScoreByRatingId: voteMaps.voteScoreByRatingId,
      commentCountByRatingId
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
  const ratingIds = ratingRows.map((item) => item.id);
  const [voteMaps, commentCountByRatingId] = await Promise.all([
    getRatingVoteMaps(ratingIds, currentUserId),
    getRatingCommentCounts(ratingIds)
  ]);

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId,
      personName: item.people.name,
      currentUserVoteByRatingId: voteMaps.currentUserVoteByRatingId,
      voteScoreByRatingId: voteMaps.voteScoreByRatingId,
      commentCountByRatingId
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
  const ratingIds = ratingRows.map((item) => item.id);
  const [voteMaps, commentCountByRatingId] = await Promise.all([
    getRatingVoteMaps(ratingIds, currentUserId),
    getRatingCommentCounts(ratingIds)
  ]);

  return ratingRows.map((item) =>
    toFeedRating(item, {
      personId: item.people.id,
      personName: item.people.name,
      currentUserVoteByRatingId: voteMaps.currentUserVoteByRatingId,
      voteScoreByRatingId: voteMaps.voteScoreByRatingId,
      commentCountByRatingId
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

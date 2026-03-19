export type PersonSummary = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  description: string | null;
  image_url: string | null;
};

export type PersonDetail = PersonSummary;

export type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type RankedPerson = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  avatarUrl: string | null;
  description: string | null;
  ratingCount: number;
  commentCount: number;
  averageStars: number;
  lowestStars: number | null;
  engagementScore: number;
  rank: number | null;
};

export type FeedRating = {
  id: string;
  personId: string;
  personName: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorAvatarLabel: string | null;
  stars: number;
  text: string;
  createdAt: string;
  voteScore: number;
  currentUserVote: -1 | 0 | 1;
  commentCount: number;
};

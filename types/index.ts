export type PersonSummary = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  description: string | null;
  image_url: string | null;
};

export type PersonDetail = PersonSummary;

export type RankedPerson = {
  id: string;
  name: string;
  createdAt: string;
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
  likeCount: number;
  likedByCurrentUser: boolean;
};

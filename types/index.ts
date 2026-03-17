export type PersonSummary = {
  id: string;
  name: string;
  created_at: string;
};

export type PersonDetail = PersonSummary;

export type RankedPerson = {
  id: string;
  name: string;
  createdAt: string;
  avatarUrl: string | null;
  ratingCount: number;
  commentCount: number;
  averageStars: number;
  engagementScore: number;
  rank: number;
};

export type FeedRating = {
  id: string;
  personId: string;
  personName: string;
  userId: string;
  stars: number;
  text: string;
  createdAt: string;
};

export type UserRatingSummary = FeedRating;

export type PersonSummary = {
  id: string;
  name: string;
  created_at: string;
};

export type PersonDetail = PersonSummary;

export type FeedRating = {
  id: string;
  personId: string;
  personName: string;
  stars: number;
  text: string;
  createdAt: string;
};

export type UserRatingSummary = FeedRating;

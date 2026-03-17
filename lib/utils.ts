export function renderStars(stars: number) {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
}

type RankedPersonSource = {
  id: string;
  name: string;
  created_at: string;
  ratings:
    | {
        stars: number;
        text: string;
      }[]
    | null;
};

export function formatDate(input: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(input));
}

export function formatAverage(value: number) {
  if (!value) {
    return "No ratings yet";
  }

  return `${value.toFixed(1)} / 5`;
}

export function cleanPersonName(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

export function normalizePersonName(input: string) {
  return cleanPersonName(input).toLowerCase();
}

export function getInitials(input: string) {
  const parts = cleanPersonName(input).split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildRankedPeople(rows: RankedPersonSource[]) {
  return rows
    .map((person) => {
      const ratings = person.ratings ?? [];
      const ratingCount = ratings.length;
      const commentCount = ratings.filter((rating) => rating.text.trim().length > 0).length;
      const averageStars =
        ratingCount > 0
          ? ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratingCount
          : 0;

      return {
        id: person.id,
        name: person.name,
        createdAt: person.created_at,
        avatarUrl: null,
        ratingCount,
        commentCount,
        averageStars,
        engagementScore: ratingCount + commentCount,
        rank: 0
      };
    })
    .sort((left, right) => {
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
    })
    .map((person, index) => ({
      ...person,
      rank: index + 1
    }));
}

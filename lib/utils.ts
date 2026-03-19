export function renderStars(stars: number) {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
}

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

export function resolveAvatarLabel(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalizedValue = value?.trim();

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return "?";
}

export function getProfileHref(profileId: string, currentUserId?: string | null) {
  return currentUserId === profileId ? "/profile" : `/profile/${profileId}`;
}

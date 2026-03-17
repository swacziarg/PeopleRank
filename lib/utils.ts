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

import { formatAverage } from "@/lib/utils";
import type { FeedRating } from "@/types";

type RatingTrendChartProps = {
  ratings: FeedRating[];
};

type TrendPoint = {
  label: string;
  value: number;
};

function buildTrendPoints(ratings: FeedRating[]): TrendPoint[] {
  const sortedRatings = [...ratings].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const rating of sortedRatings) {
    const bucketKey = rating.createdAt.slice(0, 10);
    const currentBucket = buckets.get(bucketKey) ?? { sum: 0, count: 0 };
    currentBucket.sum += rating.stars;
    currentBucket.count += 1;
    buckets.set(bucketKey, currentBucket);
  }

  let cumulativeSum = 0;
  let cumulativeCount = 0;

  return [...buckets.entries()].map(([label, bucket]) => {
    cumulativeSum += bucket.sum;
    cumulativeCount += bucket.count;

    return {
      label,
      value: cumulativeSum / cumulativeCount
    };
  });
}

function formatTrendLabel(input: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${input}T00:00:00Z`));
}

export function RatingTrendChart({ ratings }: RatingTrendChartProps) {
  const points = buildTrendPoints(ratings);

  if (points.length < 2) {
    return (
      <div className="rounded-3xl border border-line bg-panel p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Rating over time</h2>
          <p className="text-sm text-zinc-400">
            Not enough rating history to draw a trend yet.
          </p>
        </div>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const paddingX = 28;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const x = paddingX + index * stepX;
    const y = paddingY + ((5 - point.value) / 4) * chartHeight;

    return {
      ...point,
      x,
      y
    };
  });

  const path = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];

  return (
    <div className="rounded-3xl border border-line bg-panel p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Rating over time</h2>
          <p className="text-sm text-zinc-400">
            Daily buckets with a cumulative average rating.
          </p>
        </div>
        <p className="text-sm text-zinc-300">
          Current trend:{" "}
          <span className="font-medium text-white">{formatAverage(lastPoint.value)}</span>
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 min-w-[640px] w-full"
          role="img"
          aria-label="Average rating over time"
        >
          {[1, 2, 3, 4, 5].map((tick) => {
            const y = paddingY + ((5 - tick) / 4) * chartHeight;

            return (
              <g key={tick}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  className="stroke-zinc-800"
                  strokeWidth="1"
                />
                <text x={8} y={y + 4} className="fill-zinc-500 text-[10px]">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={path} fill="none" className="stroke-amber-300" strokeWidth="3" />

          {chartPoints.map((point) => (
            <circle
              key={point.label}
              cx={point.x}
              cy={point.y}
              r="4"
              className="fill-amber-300"
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500">
        <span>{formatTrendLabel(firstPoint.label)}</span>
        <span>{formatTrendLabel(lastPoint.label)}</span>
      </div>
    </div>
  );
}

"use client";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRatingInput({
  value,
  onChange
}: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-2" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition ${
            star <= value ? "text-accent" : "text-zinc-600 hover:text-zinc-400"
          }`}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

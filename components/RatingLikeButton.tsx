"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type RatingLikeButtonProps = {
  ratingId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  text: string;
};

export function RatingLikeButton({
  ratingId,
  initialLikeCount,
  initialLiked,
  text
}: RatingLikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasComment = text.trim().length > 0;

  if (!hasComment) {
    return null;
  }

  const handleToggle = async () => {
    if (!isSupabaseConfigured || submitting) {
      return;
    }

    setError("");
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    setSubmitting(true);

    const nextLiked = !liked;
    const nextLikeCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikeCount(nextLikeCount);

    const { error: mutationError } = nextLiked
      ? await supabase.from("rating_likes").insert({
          rating_id: ratingId,
          user_id: user.id
        })
      : await supabase
          .from("rating_likes")
          .delete()
          .eq("rating_id", ratingId)
          .eq("user_id", user.id);

    if (mutationError) {
      setLiked(!nextLiked);
      setLikeCount(likeCount);
      setError(mutationError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={submitting}
        aria-pressed={liked}
        className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          liked
            ? "border-accent bg-accent text-ink"
            : "border-line bg-zinc-900 text-zinc-200 hover:border-zinc-500"
        }`}
      >
        {liked ? "♥ Liked" : "♡ Like"} {likeCount}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "@/components/StarRatingInput";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { FeedRating } from "@/types";

type RatePersonFormProps = {
  personId: string;
  personName: string;
  ratingId?: string;
  initialStars?: number;
  initialText?: string;
  submitLabel?: string;
  submittingLabel?: string;
  redirectTo?: string;
  onSuccess?: (rating: FeedRating) => void;
  onCancel?: () => void;
};

export function RatePersonForm({
  personId,
  personName,
  ratingId,
  initialStars = 4,
  initialText = "",
  submitLabel,
  submittingLabel,
  redirectTo,
  onSuccess,
  onCancel
}: RatePersonFormProps) {
  const router = useRouter();
  const [stars, setStars] = useState(initialStars);
  const [text, setText] = useState(initialText);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(ratingId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=/rate/${personId}`);
      return;
    }

    setSubmitting(true);
    const payload = {
      stars,
      text: text.trim()
    };

    const query = ratingId
      ? supabase
          .from("ratings")
          .update(payload)
          .eq("id", ratingId)
          .eq("user_id", user.id)
          .select("id, user_id, stars, text, created_at")
          .single()
      : supabase
          .from("ratings")
          .insert({
            ...payload,
            user_id: user.id,
            person_id: personId
          })
          .select("id, user_id, stars, text, created_at")
          .single();

    const { data, error: mutationError } = await query;

    if (mutationError || !data) {
      setError(mutationError?.message || "Unable to save rating.");
      setSubmitting(false);
      return;
    }

    const savedRating: FeedRating = {
      id: data.id,
      userId: data.user_id,
      personId,
      personName,
      stars: data.stars,
      text: data.text,
      createdAt: data.created_at
    };

    onSuccess?.(savedRating);

    if (onSuccess) {
      setSubmitting(false);
      return;
    }

    router.push(redirectTo ?? `/person/${personId}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow"
    >
      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Star rating
          </span>
          <StarRatingInput value={stars} onChange={setStars} />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Your review for {personName}
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            maxLength={200}
            rows={4}
            placeholder="Competent under pressure, suspiciously bad at parking."
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
        </label>

        <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
          <span>{text.length}/200 characters</span>
          <span>Public and intentionally unserious</span>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? submittingLabel || (isEditing ? "Saving..." : "Posting...")
            : submitLabel || (isEditing ? "Save changes" : "Post rating")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="ml-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition-colors hover:border-zinc-500 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

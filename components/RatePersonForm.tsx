"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "@/components/StarRatingInput";
import {
  ensureProfileForUser,
  getAuthenticatedUser,
  getDisplayNameFallback
} from "@/lib/authProfile";
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
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      router.push(`/login?next=/rate/${personId}`);
      return;
    }

    setSubmitting(true);
    const { error: profileError } = await ensureProfileForUser(supabase, user);

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    const trimmedText = text.trim();
    const payload = {
      stars,
      text: trimmedText
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
      authorName: getDisplayNameFallback(user),
      authorAvatarLabel: getDisplayNameFallback(user),
      authorAvatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null,
      stars: data.stars,
      text: data.text,
      createdAt: data.created_at,
      voteScore: 0,
      currentUserVote: 0,
      commentCount: 0
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
      className="rounded-3xl border border-line bg-panel p-6"
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
            Comment for {personName} <span className="text-zinc-500">(optional)</span>
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={200}
            rows={4}
            placeholder="Competent under pressure, suspiciously bad at parking."
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
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
            className="ml-3 rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

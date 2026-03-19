"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import { RatingLikeButton } from "@/components/RatingLikeButton";
import { RatingCard } from "@/components/RatingCard";
import { RatePersonForm } from "@/components/RatePersonForm";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { FeedRating } from "@/types";

type ManageRatingCardProps = {
  rating: FeedRating;
  currentUserId: string | null;
  showPersonLink?: boolean;
  showAuthor?: boolean;
};

export function ManageRatingCard({
  rating,
  currentUserId,
  showPersonLink = true,
  showAuthor = true
}: ManageRatingCardProps) {
  const router = useRouter();
  const [currentRating, setCurrentRating] = useState(rating);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState("");
  const isOwner = currentUserId === currentRating.userId;

  if (isDeleted) {
    return null;
  }

  const handleDelete = async () => {
    if (!isOwner || isDeleting) {
      return;
    }

    setIsConfirmOpen(false);
    setError("");
    setIsDeleting(true);

    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from("ratings")
      .delete()
      .eq("id", currentRating.id)
      .eq("user_id", currentRating.userId);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    setIsDeleted(true);
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <RatePersonForm
          personId={currentRating.personId}
          personName={currentRating.personName}
          ratingId={currentRating.id}
          initialStars={currentRating.stars}
          initialText={currentRating.text}
          onSuccess={(updatedRating) => {
            setCurrentRating((previousRating) => ({
              ...updatedRating,
              likeCount: previousRating.likeCount,
              likedByCurrentUser: previousRating.likedByCurrentUser
            }));
            setIsEditing(false);
            router.refresh();
          }}
          onCancel={() => {
            setError("");
            setIsEditing(false);
          }}
        />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <RatingCard
      ratingId={currentRating.id}
      personId={currentRating.personId}
      personName={currentRating.personName}
      authorName={currentRating.authorName}
      authorAvatarUrl={currentRating.authorAvatarUrl}
      authorAvatarLabel={currentRating.authorAvatarLabel}
      stars={currentRating.stars}
      text={currentRating.text}
      createdAt={currentRating.createdAt}
      showPersonLink={showPersonLink}
      showAuthor={showAuthor}
      likeControl={
        <RatingLikeButton
          ratingId={currentRating.id}
          initialLikeCount={currentRating.likeCount}
          initialLiked={currentRating.likedByCurrentUser}
          text={currentRating.text}
        />
      }
      actions={
        isOwner ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsEditing(true);
              }}
              className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <ConfirmModal
              open={isConfirmOpen}
              title="Delete this rating?"
              description="This removes your rating from the page."
              confirmLabel="Delete"
              destructive
              busy={isDeleting}
              onConfirm={() => {
                void handleDelete();
              }}
              onClose={() => setIsConfirmOpen(false)}
            />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>
        ) : null
      }
    />
  );
}

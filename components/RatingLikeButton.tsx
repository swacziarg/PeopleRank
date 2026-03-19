"use client";

import Link from "next/link";
import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import {
  ensureProfileForUser,
  getAuthenticatedUser,
  getDisplayNameFallback
} from "@/lib/authProfile";
import { formatDate, getProfileHref } from "@/lib/utils";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type RatingLikeButtonProps = {
  ratingId: string;
  initialVoteScore: number;
  initialUserVote: -1 | 0 | 1;
  initialCommentCount: number;
};

type ProfileRow = {
  id: string;
  avatar_url: string | null;
  display_name: string | null;
  username: string;
};

type CommentRecord = {
  id: string;
  ratingId: string;
  userId: string;
  parentId: string | null;
  text: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorAvatarLabel: string;
};

function buildCommentRecord(
  comment: {
    id: string;
    rating_id: string | null;
    user_id: string | null;
    parent_id: string | null;
    text: string;
    created_at: string | null;
  },
  profileById: Map<string, ProfileRow>
): CommentRecord | null {
  if (!comment.rating_id || !comment.user_id) {
    return null;
  }

  const profile = profileById.get(comment.user_id);
  const authorName = getDisplayNameFallback(
    {
      email: undefined,
      user_metadata: {}
    },
    profile
  );

  return {
    id: comment.id,
    ratingId: comment.rating_id,
    userId: comment.user_id,
    parentId: comment.parent_id,
    text: comment.text,
    createdAt: comment.created_at ?? new Date().toISOString(),
    authorName,
    authorAvatarUrl: profile?.avatar_url ?? null,
    authorAvatarLabel: authorName
  };
}

function getReplyCountForComment(comments: CommentRecord[], commentId: string) {
  return comments.filter((comment) => comment.parentId === commentId).length;
}

function CommentItem({
  comment,
  currentUserId,
  canReply,
  isReplying,
  replyText,
  replySubmitting,
  busyDeleteId,
  onReplyStart,
  onReplyTextChange,
  onReplyCancel,
  onReplySubmit,
  onDelete,
  children
}: {
  comment: CommentRecord;
  currentUserId: string | null;
  canReply: boolean;
  isReplying: boolean;
  replyText: string;
  replySubmitting: boolean;
  busyDeleteId: string | null;
  onReplyStart: (comment: CommentRecord) => void;
  onReplyTextChange: (value: string) => void;
  onReplyCancel: () => void;
  onReplySubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (comment: CommentRecord) => void;
  children?: ReactNode;
}) {
  const isOwner = currentUserId === comment.userId;
  const authorHref = getProfileHref(comment.userId, currentUserId);

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-zinc-950 p-3">
      <div className="flex items-start gap-3">
        <Link href={authorHref} className="shrink-0">
          <Avatar
            imageUrl={comment.authorAvatarUrl}
            label={comment.authorAvatarLabel}
            alt={`${comment.authorName} avatar`}
            sizeClassName="h-8 w-8"
            textClassName="text-xs"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Link
              href={authorHref}
              className="font-medium text-zinc-100 transition-colors hover:text-white"
            >
              {comment.authorName}
            </Link>
            <span className="text-zinc-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{comment.text}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
            {canReply ? (
              <button
                type="button"
                onClick={() => onReplyStart(comment)}
                className="transition-colors hover:text-white"
              >
                Reply
              </button>
            ) : null}
            {isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                disabled={busyDeleteId === comment.id}
                className="transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyDeleteId === comment.id ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isReplying ? (
        <form onSubmit={onReplySubmit} className="space-y-2 pl-11">
          <textarea
            value={replyText}
            onChange={(event) => onReplyTextChange(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Write a reply"
            className="w-full rounded-2xl border border-line bg-panel px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={replySubmitting}
              className="rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-xs text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {replySubmitting ? "Replying..." : "Post reply"}
            </button>
            <button
              type="button"
              onClick={onReplyCancel}
              disabled={replySubmitting}
              className="text-xs text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <span className="text-xs text-zinc-500">{replyText.length}/300</span>
          </div>
        </form>
      ) : null}

      {children}
    </div>
  );
}

export function RatingLikeButton({
  ratingId,
  initialVoteScore,
  initialUserVote,
  initialCommentCount
}: RatingLikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [voteScore, setVoteScore] = useState(initialVoteScore);
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(initialUserVote);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [topLevelText, setTopLevelText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommentRecord | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const topLevelComments = useMemo(
    () => comments.filter((comment) => comment.parentId === null),
    [comments]
  );

  const repliesByParentId = useMemo(() => {
    const topLevelIds = new Set(topLevelComments.map((comment) => comment.id));
    const map = new Map<string, CommentRecord[]>();

    for (const comment of comments) {
      if (!comment.parentId || !topLevelIds.has(comment.parentId)) {
        continue;
      }

      map.set(comment.parentId, [...(map.get(comment.parentId) ?? []), comment]);
    }

    return map;
  }, [comments, topLevelComments]);

  const requireUser = async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return null;
    }

    setCurrentUserId(user.id);
    return { supabase, user };
  };

  const loadComments = async () => {
    if (commentsLoaded || commentsLoading || !isSupabaseConfigured) {
      return;
    }

    setCommentsLoading(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    const user = await getAuthenticatedUser(supabase);
    setCurrentUserId(user?.id ?? null);
    const { data, error: commentsError } = await supabase
      .from("rating_comments")
      .select("id, rating_id, user_id, parent_id, text, created_at")
      .eq("rating_id", ratingId)
      .order("created_at", { ascending: true });

    if (commentsError || !data) {
      setError(commentsError?.message || "Unable to load comments.");
      setCommentsLoading(false);
      return;
    }

    const userIds = Array.from(
      new Set(data.map((comment) => comment.user_id).filter(Boolean))
    ) as string[];
    const profileById = new Map<string, ProfileRow>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      for (const profile of profiles ?? []) {
        profileById.set(profile.id, profile);
      }
    }

    setComments(
      data
        .map((comment) => buildCommentRecord(comment, profileById))
        .filter((comment): comment is CommentRecord => Boolean(comment))
    );
    setCommentsLoaded(true);
    setCommentsLoading(false);
  };

  const handleCommentsToggle = async () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);

    if (nextOpen) {
      await loadComments();
    }
  };

  const handleVote = async (nextValue: -1 | 1) => {
    if (submittingVote) {
      return;
    }

    const auth = await requireUser();

    if (!auth) {
      return;
    }

    setError("");
    setSubmittingVote(true);

    const previousVote = userVote;
    const previousScore = voteScore;
    const resolvedVote = previousVote === nextValue ? 0 : nextValue;
    const scoreDelta = resolvedVote - previousVote;

    setUserVote(resolvedVote);
    setVoteScore(previousScore + scoreDelta);

    const { supabase, user } = auth;
    const mutation =
      resolvedVote === 0
        ? supabase
            .from("rating_votes")
            .delete()
            .eq("rating_id", ratingId)
            .eq("user_id", user.id)
        : supabase.from("rating_votes").upsert(
            {
              rating_id: ratingId,
              user_id: user.id,
              value: resolvedVote
            },
            {
              onConflict: "user_id,rating_id"
            }
          );

    const { error: voteError } = await mutation;

    if (voteError) {
      setUserVote(previousVote);
      setVoteScore(previousScore);
      setError(voteError.message);
      setSubmittingVote(false);
      return;
    }

    setSubmittingVote(false);
    router.refresh();
  };

  const insertComment = async (parentId: string | null, text: string) => {
    const auth = await requireUser();

    if (!auth) {
      return false;
    }

    const { supabase, user } = auth;
    setError("");
    setSubmittingComment(true);

    const { error: profileError } = await ensureProfileForUser(supabase, user);

    if (profileError) {
      setError(profileError.message);
      setSubmittingComment(false);
      return false;
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("Comment cannot be empty.");
      setSubmittingComment(false);
      return false;
    }

    const { data, error: insertError } = await supabase
      .from("rating_comments")
      .insert({
        rating_id: ratingId,
        user_id: user.id,
        parent_id: parentId,
        text: trimmedText
      })
      .select("id, rating_id, user_id, parent_id, text, created_at")
      .single();

    if (insertError || !data) {
      setError(insertError?.message || "Unable to post comment.");
      setSubmittingComment(false);
      return false;
    }

    const authorName = getDisplayNameFallback(user);
    const nextComment: CommentRecord = {
      id: data.id,
      ratingId: data.rating_id ?? ratingId,
      userId: data.user_id ?? user.id,
      parentId: data.parent_id,
      text: data.text,
      createdAt: data.created_at ?? new Date().toISOString(),
      authorName,
      authorAvatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null,
      authorAvatarLabel: authorName
    };

    setComments((currentComments) => [...currentComments, nextComment]);
    setCommentCount((currentCount) => currentCount + 1);
    setCommentsLoaded(true);
    setCommentsOpen(true);
    setCurrentUserId(user.id);
    setSubmittingComment(false);
    router.refresh();
    return true;
  };

  const handleTopLevelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await insertComment(null, topLevelText);

    if (success) {
      setTopLevelText("");
    }
  };

  const handleReplySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!replyTarget || replyTarget.parentId !== null) {
      return;
    }

    const success = await insertComment(replyTarget.id, replyText);

    if (success) {
      setReplyTarget(null);
      setReplyText("");
    }
  };

  const handleDelete = async (comment: CommentRecord) => {
    if (busyDeleteId) {
      return;
    }

    const auth = await requireUser();

    if (!auth) {
      return;
    }

    setError("");
    setBusyDeleteId(comment.id);

    const { supabase, user } = auth;
    const { error: deleteError } = await supabase
      .from("rating_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      setBusyDeleteId(null);
      return;
    }

    const removedCount =
      1 +
      (comment.parentId === null ? getReplyCountForComment(comments, comment.id) : 0);

    setComments((currentComments) =>
      currentComments.filter(
        (currentComment) =>
          currentComment.id !== comment.id && currentComment.parentId !== comment.id
      )
    );
    setCommentCount((currentCount) => Math.max(0, currentCount - removedCount));

    if (replyTarget?.id === comment.id || replyTarget?.parentId === comment.id) {
      setReplyTarget(null);
      setReplyText("");
    }

    setBusyDeleteId(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => void handleVote(1)}
          disabled={submittingVote}
          aria-pressed={userVote === 1}
          className={`rounded-full border px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            userVote === 1
              ? "border-accent bg-accent text-ink"
              : "border-line bg-zinc-900 text-zinc-200 hover:border-zinc-500"
          }`}
        >
          👍 
        </button>
        <button
          type="button"
          onClick={() => void handleVote(-1)}
          disabled={submittingVote}
          aria-pressed={userVote === -1}
          className={`rounded-full border px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            userVote === -1
              ? "border-accent bg-accent text-ink"
              : "border-line bg-zinc-900 text-zinc-200 hover:border-zinc-500"
          }`}
        >
          👎 
        </button>
        <span className="text-zinc-400">Score {voteScore}</span>
        <button
          type="button"
          onClick={() => void handleCommentsToggle()}
          className="rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-zinc-200 transition-colors hover:border-zinc-500"
        >
          Comments {commentCount}
        </button>
      </div>

      {commentsOpen ? (
        <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
          {commentsLoading ? (
            <p className="text-sm text-zinc-400">Loading comments...</p>
          ) : topLevelComments.length > 0 ? (
            <div className="space-y-3">
              {topLevelComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  canReply
                  isReplying={replyTarget?.id === comment.id}
                  replyText={replyText}
                  replySubmitting={submittingComment}
                  busyDeleteId={busyDeleteId}
                  onReplyStart={(nextComment) => {
                    setReplyTarget(nextComment);
                    setReplyText("");
                  }}
                  onReplyTextChange={setReplyText}
                  onReplyCancel={() => {
                    setReplyTarget(null);
                    setReplyText("");
                  }}
                  onReplySubmit={(event) => void handleReplySubmit(event)}
                  onDelete={(nextComment) => void handleDelete(nextComment)}
                >
                  {(repliesByParentId.get(comment.id) ?? []).length > 0 ? (
                    <div className="space-y-3 pl-6">
                      {(repliesByParentId.get(comment.id) ?? []).map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          currentUserId={currentUserId}
                          canReply={false}
                          isReplying={false}
                          replyText=""
                          replySubmitting={false}
                          busyDeleteId={busyDeleteId}
                          onReplyStart={() => undefined}
                          onReplyTextChange={() => undefined}
                          onReplyCancel={() => undefined}
                          onReplySubmit={(_event) => undefined}
                          onDelete={(nextComment) => void handleDelete(nextComment)}
                        />
                      ))}
                    </div>
                  ) : null}
                </CommentItem>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No comments yet.</p>
          )}

          <form onSubmit={handleTopLevelSubmit} className="space-y-2 border-t border-line pt-3">
            <textarea
              value={topLevelText}
              onChange={(event) => setTopLevelText(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Add a comment"
              className="w-full rounded-2xl border border-line bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-accent"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submittingComment}
                className="rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-xs text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingComment ? "Posting..." : "Post comment"}
              </button>
              <span className="text-xs text-zinc-500">{topLevelText.length}/300</span>
            </div>
          </form>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

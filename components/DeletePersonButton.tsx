"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/Modal";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type DeletePersonButtonProps = {
  personId: string;
  currentUserId: string;
};

export function DeletePersonButton({
  personId,
  currentUserId
}: DeletePersonButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsConfirmOpen(false);
    setError("");
    setIsDeleting(true);

    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from("people")
      .delete()
      .eq("id", personId)
      .eq("created_by", currentUserId);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    router.replace("/search");
    router.refresh();
  };

  return (
    <div className="flex flex-col items-start gap-2">
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
        title="Delete this person?"
        description="This removes the page and its ratings."
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
  );
}

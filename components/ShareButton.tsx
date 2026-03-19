"use client";

import { useEffect, useRef, useState } from "react";
import { shareUrl } from "@/lib/shareUrl";

type ShareButtonProps = {
  title: string;
  path: string;
  hash?: string;
  compact?: boolean;
  className?: string;
};

export function ShareButton({
  title,
  path,
  hash,
  compact = false,
  className
}: ShareButtonProps) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    const url = new URL(path, window.location.origin);

    if (hash) {
      url.hash = hash;
    }

    const result = await shareUrl({
      title,
      url: url.toString()
    });

    if (result === "cancelled") {
      return;
    }

    setMessage(result === "copied" ? "Link copied" : "Shared");
    timeoutRef.current = window.setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <button
        type="button"
        aria-label="Share"
        onClick={() => {
          void handleShare();
        }}
        className={
          className ??
          (compact
            ? "rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            : "rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500")
        }
      >
        Share
      </button>
      {message ? (
        <p className="text-xs text-zinc-400" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}

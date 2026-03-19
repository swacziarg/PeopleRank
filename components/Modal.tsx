"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

type BaseModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

type AlertModalProps = {
  open: boolean;
  title: string;
  description?: string;
  buttonLabel?: string;
  onClose: () => void;
};

function BaseModal({
  open,
  title,
  description,
  onClose,
  children
}: BaseModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-panel p-6 shadow-2xl"
      >
        <div className="space-y-2">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-sm text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            className="sr-only"
          >
            Close
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  return (
    <BaseModal
      open={open}
      title={title}
      description={description}
      onClose={busy ? () => undefined : onClose}
    >
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          destructive
            ? "bg-rose-500 text-white hover:bg-rose-400"
            : "bg-accent text-ink hover:bg-amber-300"
        }`}
      >
        {busy ? "Working..." : confirmLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cancelLabel}
      </button>
    </BaseModal>
  );
}

export function AlertModal({
  open,
  title,
  description,
  buttonLabel = "Close",
  onClose
}: AlertModalProps) {
  return (
    <BaseModal open={open} title={title} description={description} onClose={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-amber-300"
      >
        {buttonLabel}
      </button>
    </BaseModal>
  );
}

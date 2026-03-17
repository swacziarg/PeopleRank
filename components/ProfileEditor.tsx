"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type ProfileEditorProps = {
  userId: string;
  email: string;
  createdAt: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
  initialUsername: string;
};

export function ProfileEditor({
  userId,
  email,
  createdAt,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  initialUsername
}: ProfileEditorProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolvedName = displayName.trim() || initialUsername || email || "User";
  const initials = useMemo(() => getInitials(resolvedName), [resolvedName]);
  const normalizedAvatarUrl = avatarUrl.trim();

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const resetForm = () => {
    setDisplayName(initialDisplayName);
    setBio(initialBio);
    setAvatarUrl(initialAvatarUrl);
    setError("");
    setSuccess("");
  };

  const openEditor = () => {
    resetForm();
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
    setIsMenuOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error: saveError } = await supabase.from("profiles").upsert({
      id: userId,
      username: initialUsername || email.split("@")[0] || userId,
      display_name: displayName.trim() || null,
      bio: bio.trim(),
      avatar_url: normalizedAvatarUrl || null
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSuccess("Profile saved.");
    setSaving(false);
    setIsEditing(false);
    setIsMenuOpen(false);
    router.refresh();
  };

  const handleDeleteProfile = async () => {
    setIsMenuOpen(false);

    if (
      isDeletingProfile ||
      !window.confirm(
        "Delete your profile? This removes your profile row and signs you out."
      )
    ) {
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    setError("");
    setSuccess("");
    setIsDeletingProfile(true);

    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeletingProfile(false);
      return;
    }

    await supabase.auth.signOut();
    window.alert("Profile deleted. Contact support to fully remove account.");
    router.replace("/login");
    router.refresh();
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);

    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="w-full">
      <div
        ref={menuRef}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsMenuOpen(false);
            if (isEditing) {
              handleCancel();
            }
          }
        }}
      >
        <button
          type="button"
          aria-label="Profile options"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl leading-none text-white transition-colors hover:bg-white/10"
        >
          <span aria-hidden="true">⋯</span>
        </button>

        {isMenuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 min-w-40 rounded-2xl border border-white/8 bg-zinc-950/95 p-2 shadow-2xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={openEditor}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/5"
            >
              Edit profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleDeleteProfile}
              disabled={isDeletingProfile}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingProfile ? "Deleting profile..." : "Delete profile"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void handleSignOut();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4 w-full rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow sm:min-w-[32rem]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {normalizedAvatarUrl ? (
                <img
                  src={normalizedAvatarUrl}
                  alt="Profile avatar preview"
                  className="h-16 w-16 rounded-full border border-line object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-black/20 text-xl font-semibold text-accent">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">{resolvedName}</h2>
                <p className="text-sm text-zinc-400">{email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Joined {formatDate(createdAt)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                placeholder="How your name should appear"
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Avatar URL
              </span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                maxLength={280}
                placeholder="Short bio"
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
                <p className="mt-2 text-sm text-white">{email || "Not available"}</p>
              </div>
              <div className="rounded-2xl border border-line bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Joined</p>
                <p className="mt-2 text-sm text-white">{formatDate(createdAt)}</p>
              </div>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
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

  const resolvedName = displayName.trim() || initialUsername || email || "User";
  const initials = useMemo(() => resolvedName.slice(0, 1).toUpperCase(), [resolvedName]);
  const normalizedAvatarUrl = avatarUrl.trim();

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
    router.refresh();
  };

  return (
    <div className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow">
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

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

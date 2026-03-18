"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { cleanPersonName } from "@/lib/utils";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type EditPersonFormProps = {
  personId: string;
  initialName: string;
  initialDescription: string;
  initialImageUrl: string;
};

export function EditPersonForm({
  personId,
  initialName,
  initialDescription,
  initialImageUrl
}: EditPersonFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewName = useMemo(() => cleanPersonName(name) || "?", [name]);
  const normalizedImageUrl = imageUrl.trim();

  const resetForm = () => {
    setName(initialName);
    setDescription(initialDescription);
    setImageUrl(initialImageUrl);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const cleanedName = cleanPersonName(name);

    if (!cleanedName) {
      setError("Enter a valid name.");
      return;
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("people")
      .update({
        name: cleanedName,
        description: description.trim() || null,
        image_url: normalizedImageUrl || null
      })
      .eq("id", personId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsEditing(true);
        }}
        className="rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm text-white transition-colors hover:border-zinc-500"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-line bg-panel p-6">
      <div className="flex items-center gap-4">
        <Avatar
          imageUrl={normalizedImageUrl}
          label={previewName}
          alt={`${previewName} preview`}
          sizeClassName="h-16 w-16"
          textClassName="text-xl"
        />
        <div>
          <h2 className="text-xl font-semibold text-white">{previewName}</h2>
          <p className="text-sm text-zinc-400">Edit your person entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Add context, lore, or a warning label."
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-200">
            Image URL
          </span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/person.jpg"
            className="w-full rounded-2xl border border-line bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-accent"
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              resetForm();
              setIsEditing(false);
            }}
            className="rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm text-white transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

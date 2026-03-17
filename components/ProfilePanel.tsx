"use client";

import { useEffect, useState } from "react";
import { RatingCard } from "@/components/RatingCard";
import { SignInForm } from "@/components/SignInForm";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { UserRatingSummary } from "@/types";

export function ProfilePanel() {
  const [email, setEmail] = useState<string | null>(null);
  const [ratings, setRatings] = useState<UserRatingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase environment variables are missing.");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setRatings([]);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data, error: ratingsError } = await supabase
        .from("ratings")
        .select("id, stars, text, created_at, people!inner(id, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ratingsError) {
        setError(ratingsError.message);
        setRatings([]);
      } else {
        setRatings(
          (data ?? []).map((item) => ({
            id: item.id,
            stars: item.stars,
            text: item.text,
            createdAt: item.created_at,
            personId: item.people.id,
            personName: item.people.name
          }))
        );
      }

      setLoading(false);
    };

    void loadProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading profile...</p>;
  }

  if (!email) {
    return <SignInForm />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-line bg-panel/80 p-6 shadow-glow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{email}</h2>
            <p className="text-sm text-zinc-400">
              Your public contributions to the ongoing civic disaster.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-white hover:border-zinc-500 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {ratings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-panel/70 p-8 text-center text-zinc-400">
          You have not posted any ratings yet.
        </div>
      ) : (
        ratings.map((rating) => (
          <RatingCard
            key={rating.id}
            personId={rating.personId}
            personName={rating.personName}
            stars={rating.stars}
            text={rating.text}
            createdAt={rating.createdAt}
          />
        ))
      )}
    </div>
  );
}

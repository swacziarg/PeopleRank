import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchRankedPeople } from "@/lib/rankedPeople";
import type { FeedRating, PersonDetail, RankedPerson } from "@/types";

export async function getLatestRatings(limit = 20): Promise<FeedRating[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("id, user_id, stars, text, created_at, people!inner(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    userId: item.user_id,
    stars: item.stars,
    text: item.text,
    createdAt: item.created_at,
    personId: item.people.id,
    personName: item.people.name
  }));
}

export async function getRatingsForPerson(
  personId: string
): Promise<FeedRating[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("id, user_id, stars, text, created_at")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    userId: item.user_id,
    stars: item.stars,
    text: item.text,
    createdAt: item.created_at,
    personId,
    personName: ""
  }));
}

export async function getPersonById(id: string): Promise<PersonDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getRankedPeople(limit = 50): Promise<RankedPerson[]> {
  const supabase = await createSupabaseServerClient();
  return fetchRankedPeople(supabase, { limit, sort: "most-rated" });
}

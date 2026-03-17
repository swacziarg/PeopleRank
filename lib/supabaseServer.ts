import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient(cookieStore);
}

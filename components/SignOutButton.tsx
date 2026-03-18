"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full border border-line bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500"
    >
      Sign out
    </button>
  );
}

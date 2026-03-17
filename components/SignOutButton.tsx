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
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 hover:bg-white/10"
    >
      Sign out
    </button>
  );
}

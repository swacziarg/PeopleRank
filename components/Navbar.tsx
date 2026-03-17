"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { SignOutButton } from "@/components/SignOutButton";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" }
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "guest">(
    "loading"
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("guest");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (isMounted) {
        setAuthState(user ? "authenticated" : "guest");
      }
    };

    void loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAuthState(session?.user ? "authenticated" : "guest");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const navItems = [
    ...baseLinks.map((link) => ({ ...link, kind: "link" as const })),
    ...(authState === "authenticated"
      ? [{ href: "/profile", label: "Profile", kind: "link" as const }]
      : []),
    ...(authState === "guest"
      ? [{ href: "/login", label: "Login", kind: "link" as const }]
      : []),
    ...(authState === "authenticated"
      ? [{ label: "Sign out", kind: "signout" as const }]
      : [])
  ];

  return (
    <header className="mb-8 shrink-0">
      <div className="relative flex items-center justify-between gap-4 rounded-[2rem] border border-white/8 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm sm:px-5">
        <div className="min-w-0 flex-1">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-semibold text-ink">
              PR
            </span>
            <div className="min-w-0">
              <p className="font-semibold tracking-tight text-white">PeopleRank</p>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Public satire
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="site-navigation"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 sm:hidden"
        >
          Menu
        </button>

        <nav
          id="site-navigation"
          aria-label="Primary"
          className={`${
            isOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-full z-30 mt-2 flex-col gap-2 rounded-[1.5rem] border border-white/8 bg-zinc-950/95 p-3 shadow-2xl sm:static sm:z-auto sm:mt-0 sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-1 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
        >
          {navItems.map((item) =>
            item.kind === "link" ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  pathname === item.href
                    ? "bg-accent text-ink"
                    : "text-zinc-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <SignOutButton key={item.label} />
            )
          )}
        </nav>
      </div>
    </header>
  );
}

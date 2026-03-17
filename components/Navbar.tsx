"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/add", label: "Add" },
  { href: "/profile", label: "Profile" },
  { href: "/login", label: "Login" },
  { href: "/about", label: "About" }
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 mb-8">
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-semibold text-ink">
              PR
            </span>
            <div>
              <p className="font-semibold tracking-tight text-white">PeopleRank</p>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Public satire
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex items-center rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-white sm:hidden"
          >
            Menu
          </button>
        </div>

        <nav
          id="site-navigation"
          aria-label="Primary"
          className={`${isOpen ? "mt-4 flex" : "hidden"} flex-col gap-2 sm:mt-4 sm:flex sm:flex-row sm:items-center sm:justify-end sm:gap-1`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm ${
                pathname === link.href
                  ? "bg-accent text-ink"
                  : "text-zinc-100 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/add", label: "Add" },
  { href: "/profile", label: "Profile" },
  { href: "/login", label: "Login" },
  { href: "/about", label: "About" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 mb-8">
      <div className="flex items-center justify-between rounded-full border border-white/10 bg-zinc-950/75 px-4 py-3 backdrop-blur">
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

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

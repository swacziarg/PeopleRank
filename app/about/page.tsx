import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-3 rounded-3xl border border-line bg-panel p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">About</p>
        <h1 className="text-3xl font-semibold text-white">What is this?</h1>
        <p className="text-zinc-300">
          PeopleRank is a public satire app. Users can add people and leave
          star-based ratings with short commentary. It is intentionally playful,
          public, and not meant to function as a serious evaluation system.
        </p>
        <p className="text-zinc-400">
          Think of it as a tiny public joke board with a database, not a truth
          machine. Use it responsibly, avoid posting abusive content, and keep
          the tone light.
        </p>
        <div className="pt-2">
          <Link
            href="/search"
            className="inline-flex rounded-full border border-line bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-zinc-500"
          >
            Explore the feed
          </Link>
        </div>
      </div>
    </section>
  );
}

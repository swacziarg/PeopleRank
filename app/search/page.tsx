import { SearchPeople } from "@/components/SearchPeople";

export default function SearchPage() {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Search</p>
        <h1 className="text-3xl font-semibold text-white">Find your subject</h1>
        <p className="max-w-2xl text-zinc-400">
          Search the public list by name and jump straight to the person page or
          the rating form.
        </p>
      </div>
      <SearchPeople />
    </section>
  );
}

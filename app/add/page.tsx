import { AddPersonForm } from "@/components/AddPersonForm";
import { BackButton } from "@/components/BackButton";

type AddPageProps = {
  searchParams?: {
    name?: string;
  };
};

export default function AddPage({ searchParams }: AddPageProps) {
  const initialName =
    typeof searchParams?.name === "string" ? searchParams.name.trim() : "";

  return (
    <section className="space-y-6 py-8 sm:py-10">
      <BackButton fallbackHref="/search" />

      <div className="space-y-3 rounded-3xl border border-line bg-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Add</p>
        <h1 className="text-3xl font-semibold text-white">Add a person</h1>
        <p className="max-w-2xl text-zinc-400">
          Create a page with one clean entry and review possible duplicates
          before you submit.
        </p>
      </div>

      <AddPersonForm initialName={initialName} />
    </section>
  );
}

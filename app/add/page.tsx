import { AddPersonForm } from "@/components/AddPersonForm";

export default function AddPage() {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Add</p>
        <h1 className="text-3xl font-semibold text-white">Add a new person</h1>
        <p className="max-w-2xl text-zinc-400">
          Create a new public profile entry for a friend, fictional character, or
          deeply polarizing group chat admin.
        </p>
      </div>
      <AddPersonForm />
    </section>
  );
}

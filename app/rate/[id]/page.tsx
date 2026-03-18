import { notFound } from "next/navigation";
import { RatePersonForm } from "@/components/RatePersonForm";
import { getPersonById } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

type RatePageProps = {
  params: {
    id: string;
  };
};

export default async function RatePage({ params }: RatePageProps) {
  if (!isSupabaseConfigured) {
    return (
      <section className="py-10">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Supabase environment variables are missing. Configure `.env.local`
          before submitting ratings.
        </div>
      </section>
    );
  }

  const person = await getPersonById(params.id);

  if (!person) {
    notFound();
  }

  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Rate</p>
        <h1 className="text-3xl font-semibold text-white">
          Rate {person.name}
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Leave a public star rating, with or without a short line. Keep any
          comment funny, brief, and under 200 characters.
        </p>
      </div>
      <RatePersonForm personId={person.id} personName={person.name} />
    </section>
  );
}

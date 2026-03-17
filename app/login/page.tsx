import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Login</p>
        <h1 className="text-3xl font-semibold text-white">
          Sign in to post and manage your profile
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Use email and password to access protected routes like profile, add,
          and rating submission.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Supabase environment variables are missing. Add
          `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to `.env.local`.
        </div>
      ) : (
        <AuthForm nextPath={searchParams?.next} />
      )}
    </section>
  );
}

import { ProfilePanel } from "@/components/ProfilePanel";

export default function ProfilePage() {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Profile</p>
        <h1 className="text-3xl font-semibold text-white">Your activity</h1>
        <p className="max-w-2xl text-zinc-400">
          Sign in with email to see the ratings you have posted and manage your
          session.
        </p>
      </div>
      <ProfilePanel />
    </section>
  );
}

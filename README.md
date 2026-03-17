# PeopleRank

PeopleRank is a satirical public rating app built with Next.js 14, Tailwind CSS, and Supabase. Users can browse public ratings, search and rank people by engagement, add new entries, and leave short 1 to 5 star reviews. Authenticated access is required for posting and for the profile area.

## Live App

https://people-rank.vercel.app

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase
  - PostgreSQL
  - Auth
  - Row Level Security
- Vercel

## Features

- Public home feed of recent ratings
- Ranked search page with browseable people feed
- Person detail page with average score and rating history
- Protected add person flow with duplicate prevention
- Protected rate person flow
- Email/password login and sign up
- Profile page with auth data, profile customization, and the user’s own ratings
- Responsive navbar with accessible mobile menu

## Pages

- `/`: latest public ratings feed
- `/search`: ranked people feed plus live search
- `/person/[id]`: person details and ratings
- `/rate/[id]`: protected rating form
- `/add`: protected form for creating a person
- `/login`: email/password login and sign up
- `/profile`: protected user account page
- `/about`: static app description

## Authentication Flow

- Supabase Auth handles email/password authentication.
- Middleware protects `/add`, `/rate/*`, and `/profile`.
- Unauthenticated users are redirected to `/login?next=...`.
- Authenticated users visiting `/login` are redirected to `/profile`.
- After successful login, users are redirected to the requested protected page or to `/profile`.
- Sign up uses Supabase Auth directly. If email confirmation is enabled in Supabase, users must confirm their email before logging in.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npm run dev
```

3. Open `http://localhost:3000`

## Supabase Setup

Run this SQL in the Supabase SQL editor:

```sql
create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text default '',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  ) stored unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  text varchar(200) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists people_name_idx
on public.people using gin (name gin_trgm_ops);

create index if not exists ratings_person_id_idx
on public.ratings (person_id);

create index if not exists ratings_user_id_idx
on public.ratings (user_id);
```

If the `people` table already exists, add the duplicate guard like this:

```sql
alter table public.people
add column if not exists normalized_name text generated always as (
  lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
) stored;

create unique index if not exists people_normalized_name_key
on public.people (normalized_name);
```

If the `profiles` table already exists, add the profile customization columns like this:

```sql
alter table public.profiles
add column if not exists display_name text;

alter table public.profiles
add column if not exists bio text;

alter table public.profiles
add column if not exists avatar_url text;
```

Enable Row Level Security:

```sql
alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.ratings enable row level security;

create policy "profiles are publicly readable"
on public.profiles
for select
using (true);

create policy "people are publicly readable"
on public.people
for select
using (true);

create policy "ratings are publicly readable"
on public.ratings
for select
using (true);

create policy "authenticated users can insert people"
on public.people
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "authenticated users can insert ratings"
on public.ratings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own ratings"
on public.ratings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete their own ratings"
on public.ratings
for delete
to authenticated
using (auth.uid() = user_id);

create policy "users can view their own profile row"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "users can insert their own profile row"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update their own profile row"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## Deployment

The app is deployed on Vercel:

https://people-rank.vercel.app

To deploy your own copy:

1. Create a Supabase project.
2. Run the schema and RLS SQL above.
3. Add the environment variables in Vercel.
4. Import the repo into Vercel.
5. Deploy.

## Profile Customization

- Users can update their display name, bio, and avatar URL from `/profile`.
- Avatars use external image URLs only.
- If no avatar URL is set, the UI falls back to initials.
- No uploads or Supabase Storage are required.

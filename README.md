# PeopleRank

PeopleRank is a satirical public rating app built with Next.js 14, Tailwind CSS, and Supabase. Users can add people, leave short star-based ratings, browse the latest jokes, and search the growing hall of questionable public opinion.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + API
- Render deployment

## Folder Tree

```text
.
├── .env.example
├── .gitignore
├── README.md
├── app
│   ├── about
│   │   └── page.tsx
│   ├── add
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── person
│   │   └── [id]
│   │       └── page.tsx
│   ├── profile
│   │   └── page.tsx
│   ├── rate
│   │   └── [id]
│   │       └── page.tsx
│   └── search
│       └── page.tsx
├── components
│   ├── AddPersonForm.tsx
│   ├── Navbar.tsx
│   ├── ProfilePanel.tsx
│   ├── RatePersonForm.tsx
│   ├── RatingCard.tsx
│   ├── SearchPeople.tsx
│   ├── SignInForm.tsx
│   └── StarRatingInput.tsx
├── lib
│   ├── queries.ts
│   ├── supabaseClient.ts
│   ├── supabaseServer.ts
│   └── utils.ts
├── next-env.d.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── types
    ├── database.ts
    └── index.ts
```

## Local Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

## Supabase Schema SQL

Run this in the Supabase SQL editor:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  bio text default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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

create index if not exists people_name_idx on public.people using gin (name gin_trgm_ops);
create index if not exists ratings_person_id_idx on public.ratings (person_id);
create index if not exists ratings_user_id_idx on public.ratings (user_id);

create extension if not exists pg_trgm;
```

If your SQL editor complains about the trigram index order, run this version instead:

```sql
create extension if not exists pg_trgm;
create index if not exists people_name_idx on public.people using gin (name gin_trgm_ops);
```

## Row Level Security

Enable RLS and add policies:

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

## Example Queries

Fetch ratings by `person_id`:

```ts
const { data, error } = await supabase
  .from("ratings")
  .select("id, stars, text, created_at")
  .eq("person_id", personId)
  .order("created_at", { ascending: false });
```

Insert a rating:

```ts
const { error } = await supabase.from("ratings").insert({
  user_id: user.id,
  person_id: personId,
  stars: 5,
  text: "Would trust them to choose the playlist."
});
```

Search people with `ILIKE`:

```ts
const { data, error } = await supabase
  .from("people")
  .select("id, name, created_at")
  .ilike("name", `%${query}%`)
  .order("name");
```

## Auth Notes

- The app uses Supabase client auth directly.
- The minimal auth flow is email OTP magic link from the profile, add, and rate screens.
- Enable Email auth in Supabase Authentication settings.
- Set your site URL in Supabase to your local or production domain so OTP redirects return correctly.

## Render Deployment

1. Create a Supabase project.
2. Run the schema SQL and RLS SQL above.
3. Copy `.env.example` to your local `.env.local`.
4. Push this repo to GitHub.
5. In Render, create a new Web Service from the GitHub repo.
6. Use:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
7. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Render environment variables.
8. Deploy.

## MVP Scope

- Public read access for people and ratings
- Authenticated inserts for people and ratings
- Home feed
- Search
- Person detail page
- Add person flow
- Rate person flow
- Profile page for current user ratings
- Static about page

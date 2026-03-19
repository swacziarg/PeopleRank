# [PeopleRank](https://en.wikipedia.org/wiki/Nosedive_(Black_Mirror))

PeopleRank is a Next.js 14 + Supabase app for public, intentionally unserious people ratings. Visitors can browse recent ratings and ranked people pages, while authenticated users can add people, post star ratings, edit their own ratings, and manage their profile.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase
  - Postgres
  - Auth
  - Row Level Security
- Vercel

## Routes

- `/`: latest public ratings feed
- `/search`: ranked people browser with live search, sort controls, and backend pagination
- `/add`: protected add-person page
- `/person/[id]`: person detail page with ratings, a rating-over-time graph, rating likes, and creator-owned edit/delete actions
- `/rate/[id]`: protected rating form
- `/profile`: protected account page with profile editing and rating management
- `/login`: email/password sign in and sign up
- `/about`: static app description

## Current UX

- Fixed top navbar with one shared desktop/mobile navigation.
- Secondary pages (`/add`, `/profile`, `/person/[id]`, `/rate/[id]`) include a lightweight back button.
- Navbar links: `Home`, `Search`, `Add`, `About`, plus `Profile` when signed in or `Login` when signed out.
- Profile actions live under the 3-dot menu.
- Search pagination shows exactly 8 people per page.
- Search pagination is backend-limited. The app does not fetch the full people list and paginate in the client.
- Search first looks for exact person-name matches and falls back to similar matches when nothing exact is found.
- Search includes an `Added by you` toggle that keeps the same sort and pagination flow.
- Add flow surfaces up to 5 possible matches while typing.
- Exact duplicates are blocked by normalized-name matching.
- After a successful add, the app redirects to the created person page.
- Destructive actions use shared custom modals instead of native `confirm()` / `alert()`.
- Person pages support `description` and `image_url`.
- People can be edited or deleted only by the user who created them.
- Avatar rendering always falls back field-by-field: image first, then initials from display name or username, then `?`.
- Ratings support:
  - stars only
  - stars plus comment
- Ratings only require authentication. Missing `username`, `bio`, `avatar_url`, or `display_name` do not block posting.
- Blank comments are hidden in the UI. Ratings with no comment show stars and metadata only.
- On the profile page, the user’s own ratings do not repeat the author block.
- Ratings can be edited or deleted only by their author.
- Search cards display lowest rating when ratings exist.
- Search sort options include `Lowest rated`.
- Ratings with comments can be liked. Star-only ratings never show like controls.
- Person pages show a lightweight SVG graph when at least two rating history buckets exist.

## Auth Flow

- Supabase Auth handles email/password login and sign up.
- Middleware protects `/add`, `/profile`, and `/rate/[id]`.
- Unauthenticated access to protected routes redirects to `/login?next=...`.
- Visiting `/login` while authenticated redirects to `/profile`.
- Sign up creates a Supabase auth user, ensures a fallback `profiles` row, and redirects into protected flows immediately.
- Protected write flows also auto-create a fallback `profiles` row if a signed-in user is missing one.
- If email confirmation is enabled in Supabase, a new user may need to confirm email before logging in.

## Profile Fields

The profile UI currently supports:

- `username`
- `display_name`
- `bio`
- `avatar_url`

`username` is created at sign up and used as a fallback display value if `display_name` is empty. Rating author names fall back in this order: `display_name`, `username`, email when available, then `Anonymous`.

People now also support:

- `description`
- `image_url`

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-anon-key
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run build
```

## Supabase Schema

Run this SQL in the Supabase SQL editor for a fresh setup.

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
  description text,
  image_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  text varchar(200) not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rating_likes (
  user_id uuid references auth.users(id) on delete cascade,
  rating_id uuid references public.ratings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, rating_id)
);

create index if not exists people_name_idx
on public.people using gin (name gin_trgm_ops);

create index if not exists ratings_person_id_idx
on public.ratings (person_id);

create index if not exists ratings_user_id_idx
on public.ratings (user_id);
```

## Required SQL Changes For Existing Projects

If your existing database predates the current app behavior, make sure these changes are in place.

### 1. Duplicate detection

```sql
alter table public.people
add column if not exists normalized_name text generated always as (
  lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
) stored;

create unique index if not exists people_normalized_name_key
on public.people (normalized_name);
```

### 2. Profile customization fields

```sql
alter table public.profiles
add column if not exists display_name text;

alter table public.profiles
add column if not exists bio text default '';

alter table public.profiles
add column if not exists avatar_url text;
```

### 3. Optional comments

The app allows star-only ratings. Empty comments must be accepted.

```sql
alter table public.ratings
alter column text set default '';
```

If you previously added a check constraint that rejects blank comments, drop it. Example:

```sql
alter table public.ratings
drop constraint if exists ratings_text_check;
```

### 4. Person metadata fields

```sql
alter table public.people
add column if not exists description text,
add column if not exists image_url text;
```

### 5. Rating likes

```sql
create table if not exists public.rating_likes (
  user_id uuid references auth.users(id) on delete cascade,
  rating_id uuid references public.ratings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, rating_id)
);
```

## Ranked Pagination Function

`/search` depends on this SQL function so every page returns only the requested 8 records from the backend. Supported sort values are `most-rated`, `most-commented`, `highest-rated`, `lowest-rated`, and `newest`. The same function also powers the `Added by you` filter.

```sql
create or replace function public.get_ranked_people_page(
  page_number integer default 1,
  page_size integer default 8,
  search_term text default null,
  sort_by text default 'most-rated',
  created_by_filter uuid default null
)
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  created_by uuid,
  image_url text,
  rating_count bigint,
  comment_count bigint,
  average_stars numeric,
  lowest_stars int,
  engagement_score bigint,
  rank bigint,
  total_count bigint
)
language sql
stable
as $$
  with people_with_stats as (
    select
      p.id,
      p.name,
      p.created_at,
      p.created_by,
      p.image_url,
      count(r.id)::bigint as rating_count,
      count(r.id) filter (
        where nullif(trim(coalesce(r.text, '')), '') is not null
      )::bigint as comment_count,
      coalesce(avg(r.stars), 0)::numeric as average_stars,
      min(r.stars)::int as lowest_stars,
      (
        count(r.id) +
        count(r.id) filter (
          where nullif(trim(coalesce(r.text, '')), '') is not null
        )
      )::bigint as engagement_score
    from public.people p
    left join public.ratings r on r.person_id = p.id
    where (
      search_term is null
      or p.name ilike '%' || search_term || '%'
    )
    and (
      created_by_filter is null
      or p.created_by = created_by_filter
    )
    group by p.id, p.name, p.created_at, p.created_by, p.image_url
  ),
  ranked as (
    select
      *,
      row_number() over (
        order by
          case when sort_by = 'highest-rated' then average_stars end desc,
          case when sort_by = 'lowest-rated' then lowest_stars end asc nulls last,
          case when sort_by = 'newest' then created_at end desc,
          case when sort_by = 'most-commented' then comment_count end desc,
          case when sort_by = 'most-rated' then rating_count end desc,
          rating_count desc,
          comment_count desc,
          average_stars desc,
          lowest_stars asc nulls last,
          created_at desc,
          name asc
      )::bigint as rank,
      count(*) over ()::bigint as total_count
    from people_with_stats
  )
  select
    id,
    name,
    created_at,
    created_by,
    image_url,
    rating_count,
    comment_count,
    average_stars,
    lowest_stars,
    engagement_score,
    rank,
    total_count
  from ranked
  order by rank
  offset greatest(page_number - 1, 0) * greatest(page_size, 1)
  limit greatest(page_size, 1);
$$;
```

## RLS Policies

Enable RLS:

```sql
alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_likes enable row level security;
```

Policies:

```sql
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

create policy "likes are readable"
on public.rating_likes
for select
using (true);

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

create policy "users can delete their own profile row"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

create policy "authenticated users can insert people"
on public.people
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "users can delete their own people"
on public.people
for delete
to authenticated
using (auth.uid() = created_by);

create policy "users can update their own people"
on public.people
for update
to authenticated
using (auth.uid() = created_by)
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

create policy "users can like ratings"
on public.rating_likes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ratings
    where ratings.id = rating_likes.rating_id
      and nullif(trim(coalesce(ratings.text, '')), '') is not null
  )
);

create policy "users can unlike ratings"
on public.rating_likes
for delete
to authenticated
using (auth.uid() = user_id);
```

## Rating Trend Graph

Person pages group ratings by day and render a simple SVG line chart of the cumulative average rating. When fewer than two day buckets exist, the page shows a fallback message instead of a graph.

## Deployment

The intended deployment target is Vercel.

1. Create a Supabase project.
2. Run the schema, pagination function, and RLS SQL above.
3. Add the two public Supabase environment variables in Vercel.
4. Import the repository into Vercel.
5. Deploy.

## Notes

- Author display is shown on public rating cards where it belongs, but hidden on the profile page for the current user’s own ratings.
- Person pages support URL-based images only. No upload flow is included.
- No file uploads or Supabase Storage are required.
- The UI is intentionally flat and minimal. No gradients or glass effects are part of the design.

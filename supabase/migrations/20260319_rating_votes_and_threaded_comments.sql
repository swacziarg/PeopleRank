drop table if exists public.rating_likes;

create table if not exists public.rating_votes (
  user_id uuid references auth.users(id) on delete cascade,
  rating_id uuid references public.ratings(id) on delete cascade,
  value int check (value in (1, -1)),
  created_at timestamptz default now(),
  primary key (user_id, rating_id)
);

create table if not exists public.rating_comments (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid references public.ratings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  parent_id uuid references public.rating_comments(id) on delete cascade,
  text varchar(300) not null,
  created_at timestamptz default now()
);

create index if not exists rating_votes_rating_id_idx
on public.rating_votes (rating_id);

create index if not exists rating_comments_rating_id_idx
on public.rating_comments (rating_id);

create index if not exists rating_comments_parent_id_idx
on public.rating_comments (parent_id);

alter table public.rating_votes enable row level security;
alter table public.rating_comments enable row level security;

create policy "votes readable"
on public.rating_votes
for select
using (true);

create policy "users can vote"
on public.rating_votes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update votes"
on public.rating_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can remove votes"
on public.rating_votes
for delete
to authenticated
using (auth.uid() = user_id);

create policy "comments readable"
on public.rating_comments
for select
using (true);

create policy "users can comment"
on public.rating_comments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    parent_id is null
    or exists (
      select 1
      from public.rating_comments parent
      where parent.id = rating_comments.parent_id
        and parent.parent_id is null
        and parent.rating_id = rating_comments.rating_id
    )
  )
);

create policy "users can delete own comments"
on public.rating_comments
for delete
to authenticated
using (auth.uid() = user_id);

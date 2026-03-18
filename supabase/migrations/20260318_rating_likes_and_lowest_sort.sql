create table if not exists public.rating_likes (
  user_id uuid references auth.users(id) on delete cascade,
  rating_id uuid references public.ratings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, rating_id)
);

alter table public.rating_likes enable row level security;

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

create policy "likes are readable"
on public.rating_likes
for select
using (true);

create or replace function public.get_ranked_people_page(
  page_number integer default 1,
  page_size integer default 8,
  search_term text default null,
  sort_by text default 'most-rated'
)
returns table (
  id uuid,
  name text,
  created_at timestamptz,
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
    where
      search_term is null
      or p.name ilike '%' || search_term || '%'
    group by p.id, p.name, p.created_at, p.image_url
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

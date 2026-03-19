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
      (count(r.id) + count(r.id) filter (
        where nullif(trim(coalesce(r.text, '')), '') is not null
      ))::bigint as engagement_score
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
    group by p.id
  ),
  ranked as (
    select
      *,
      row_number() over (
        order by
          case when sort_by = 'most-commented' then comment_count end desc,
          case when sort_by = 'highest-rated' then average_stars end desc,
          case when sort_by = 'lowest-rated' then lowest_stars end asc nulls last,
          case when sort_by = 'newest' then created_at end desc,
          case when sort_by = 'most-rated' then rating_count end desc,
          rating_count desc,
          comment_count desc,
          average_stars desc,
          lowest_stars asc nulls last,
          created_at desc,
          name asc
      )::bigint as rank
    from people_with_stats
  )
  select
    ranked.id,
    ranked.name,
    ranked.created_at,
    ranked.created_by,
    ranked.image_url,
    ranked.rating_count,
    ranked.comment_count,
    ranked.average_stars,
    ranked.lowest_stars,
    ranked.engagement_score,
    ranked.rank,
    count(*) over ()::bigint as total_count
  from ranked
  order by rank asc
  limit greatest(page_size, 1)
  offset greatest(page_number - 1, 0) * greatest(page_size, 1);
$$;

-- Migration: Add generated_image_url to product_templates and update search_products RPC

-- 1. Add generated_image_url column to product_templates
alter table public.product_templates
  add column if not exists generated_image_url text;

-- 2. Drop existing search_products function to allow return type modification
drop function if exists public.search_products(text, uuid, int, int);

-- 3. Re-create search_products RPC with generated_image_url
create or replace function public.search_products(
  search_term  text    default '',
  brand_filter uuid    default null,
  page_offset  int     default 0,
  page_limit   int     default 20
)
returns table (
  id                  uuid,
  brand_id            uuid,
  name                text,
  description         text,
  raw_image_url       text,
  generated_image_url text,
  created_at          timestamptz,
  updated_at          timestamptz,
  total_count         bigint
)
language plpgsql
as $$
declare
  clean_term text := trim(search_term);
begin
  return query
  select
    p.id,
    p.brand_id,
    p.name,
    p.description,
    p.raw_image_url,
    pt.generated_image_url,
    p.created_at,
    p.updated_at,
    count(*) over() as total_count
  from public.products p
  left join lateral (
    select pt_sub.generated_image_url
    from public.product_templates pt_sub
    where pt_sub.product_id = p.id
      and pt_sub.generated_image_url is not null
      and pt_sub.generated_image_url != ''
    order by pt_sub.updated_at desc
    limit 1
  ) pt on true
  where
    -- Brand filter (optional)
    (brand_filter is null or p.brand_id = brand_filter)
    and
    -- Search: empty = no filter; non-empty = FTS OR trigram fuzzy
    (
      clean_term = ''
      or p.search_vector @@ websearch_to_tsquery('simple', clean_term)
      or similarity(p.name, clean_term) > 0.25
    )
  order by
    case
      -- No search: newest first
      when clean_term = '' then extract(epoch from p.created_at)
      -- With search: rank by combined FTS score + trigram similarity
      else (
        ts_rank(p.search_vector, websearch_to_tsquery('simple', clean_term))
        + similarity(p.name, clean_term)
      )
    end desc
  limit  page_limit
  offset page_offset;
end;
$$;

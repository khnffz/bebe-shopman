-- Migration: Add full-text search + trigram fuzzy search to products

-- 1. Enable pg_trgm extension for fuzzy/similarity search
create extension if not exists pg_trgm;

-- 2. Add generated tsvector column (auto-updates when name/description changes)
alter table public.products
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(description, '')
    )
  ) stored;

-- 3. GIN index for fast full-text search
create index if not exists products_search_vector_idx
  on public.products using gin(search_vector);

-- 4. GIN trigram index for fuzzy search on product name
create index if not exists products_name_trgm_idx
  on public.products using gin(name gin_trgm_ops);

-- 5. RPC function: hybrid search (FTS + trigram) with pagination
create or replace function search_products(
  search_term  text    default '',
  brand_filter uuid    default null,
  page_offset  int     default 0,
  page_limit   int     default 20
)
returns table (
  id            uuid,
  brand_id      uuid,
  name          text,
  description   text,
  raw_image_url text,
  created_at    timestamptz,
  updated_at    timestamptz,
  total_count   bigint
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
    p.created_at,
    p.updated_at,
    count(*) over() as total_count
  from public.products p
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

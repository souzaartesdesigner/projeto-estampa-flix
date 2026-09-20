create extension if not exists vector;

create table if not exists public.artwork_embeddings (
  artwork_id uuid primary key references public.artworks(id) on delete cascade,
  embedding vector(3072) not null,
  model text not null default 'google/gemini-embedding-2',
  updated_at timestamptz not null default now()
);

grant all on public.artwork_embeddings to service_role;

alter table public.artwork_embeddings enable row level security;

create index if not exists artwork_embeddings_hnsw_idx
  on public.artwork_embeddings using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create or replace function public.match_artworks_by_image(
  query_embedding vector(3072),
  match_count int default 24,
  min_similarity float default 0.0
)
returns table (
  id uuid,
  slug text,
  title text,
  preview_url text,
  price_cents int,
  license_type text,
  is_featured boolean,
  is_trending boolean,
  download_count int,
  file_format text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.slug, a.title, a.preview_url, a.price_cents, a.license_type::text,
         a.is_featured, a.is_trending, a.download_count, a.file_format,
         1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.artwork_embeddings e
  join public.artworks a on a.id = e.artwork_id
  where a.is_published = true
    and 1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) >= min_similarity
  order by e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

revoke all on function public.match_artworks_by_image(vector, int, float) from public, anon, authenticated;
grant execute on function public.match_artworks_by_image(vector, int, float) to service_role;
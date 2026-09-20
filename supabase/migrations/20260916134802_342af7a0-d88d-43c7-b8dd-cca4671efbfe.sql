create or replace function public.artworks_missing_embeddings(_limit int default 10)
returns table (id uuid, preview_url text)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.preview_url
  from public.artworks a
  left join public.artwork_embeddings e on e.artwork_id = a.id
  where a.is_published = true
    and a.preview_url is not null
    and e.artwork_id is null
  order by a.created_at desc
  limit _limit;
$$;

revoke all on function public.artworks_missing_embeddings(int) from public, anon, authenticated;
grant execute on function public.artworks_missing_embeddings(int) to service_role;
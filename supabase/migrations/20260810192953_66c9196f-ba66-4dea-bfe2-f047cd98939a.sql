alter table public.site_settings 
add column if not exists google_ads_id text,
add column if not exists google_ads_purchase_label text;

-- Re-grant access to ensure new columns are accessible
grant select on public.site_settings to anon;
grant select on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

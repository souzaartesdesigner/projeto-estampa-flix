-- Create the product-images bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up RLS for the bucket
-- Allow anyone to read
create policy "Public Access"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Allow authenticated users to upload (or adjust to admin if roles are strict)
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

-- Allow authenticated users to update/delete
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images');

create policy "Authenticated Delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');

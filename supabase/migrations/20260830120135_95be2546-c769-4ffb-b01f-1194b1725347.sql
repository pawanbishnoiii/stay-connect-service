create policy "Anyone can view media of published listings"
on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'listing-media'
  and exists (
    select 1 from public.listings l
    where l.id::text = (storage.foldername(name))[2]
      and l.status = 'published'::listing_state
  )
);
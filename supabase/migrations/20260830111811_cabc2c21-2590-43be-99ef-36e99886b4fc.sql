CREATE POLICY "Listing media readable by signed in users" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'listing-media');
CREATE POLICY "Owners upload listing media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update listing media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete listing media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Chat media readable by signed in users" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'chat-media');
CREATE POLICY "Users upload chat media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own chat media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Public read for both buckets
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public read community_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'community_media');

-- Authenticated users can upload to avatars (any path, since filename includes user id)
CREATE POLICY "Auth upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Auth update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Auth delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- community_media: authenticated upload, owner update/delete
CREATE POLICY "Auth upload community_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community_media');

CREATE POLICY "Auth update own community_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community_media' AND owner = auth.uid());

CREATE POLICY "Auth delete own community_media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community_media' AND owner = auth.uid());
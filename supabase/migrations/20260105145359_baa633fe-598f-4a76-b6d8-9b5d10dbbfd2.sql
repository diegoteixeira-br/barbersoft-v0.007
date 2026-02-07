-- Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload campaign media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-media');

-- Allow public read access (for WhatsApp to fetch)
CREATE POLICY "Public can view campaign media"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their campaign media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-media' AND auth.uid()::text = (storage.foldername(name))[1]);
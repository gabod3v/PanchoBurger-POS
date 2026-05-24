-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- RLS policy: users can only access their own folder (avatars/{user_id}/...)
CREATE POLICY "users_own_avatar_folder" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

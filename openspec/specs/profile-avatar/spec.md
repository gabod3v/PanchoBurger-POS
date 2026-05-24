# Profile Avatar Specification

## Purpose

Enable avatar upload to Supabase Storage and richer profile editing. Users upload a photo, preview it, and edit personal info inline.

## Requirements

### R-1: Avatar Upload

ProfilePage MUST allow users to upload an avatar to Supabase Storage bucket `avatars`.

#### Scenario: Upload new avatar

- GIVEN a user on ProfilePage
- WHEN they click the avatar area and select an image (≤2MB, JPEG/PNG/WebP)
- THEN the file uploads to `avatars/{user_id}/avatar.*`
- AND the preview updates immediately
- AND `profiles.avatar_url` stores the public URL

#### Scenario: File too large

- GIVEN a user on ProfilePage
- WHEN they select a file >2MB
- THEN upload is rejected client-side
- AND toast shows "La imagen debe ser menor a 2MB"

#### Scenario: Wrong file format

- GIVEN a user on ProfilePage
- WHEN they select a non-image file
- THEN upload is rejected
- AND toast shows "Formato no soportado. Usa JPEG, PNG o WebP"

#### Scenario: Remove avatar

- GIVEN a user with existing avatar
- WHEN they click "Eliminar foto"
- THEN the Storage file is deleted
- AND `avatar_url` is set to null
- AND initials fallback renders

### R-2: Storage RLS

The `avatars` bucket MUST enforce user-scoped RLS: each user can only read/upload/delete their own folder.

#### Scenario: Own avatar accessible

- GIVEN a user
- WHEN reading `avatars/{auth.uid()}/*`
- THEN RLS policy `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text` grants access

#### Scenario: Other user's avatar blocked

- GIVEN a user
- WHEN attempting to read `avatars/{other_user_id}/*`
- THEN RLS denies (404/403)

### R-3: Editable Profile Fields

ProfilePage MUST allow inline editing of `full_name`, `phone`, and `document_id`.

#### Scenario: Save full name

- GIVEN a user on ProfilePage
- WHEN they edit their name and click "Guardar"
- THEN `profiles.full_name` updates in Supabase
- AND profile context refreshes
- AND success toast appears

#### Scenario: Save fails

- GIVEN a user on ProfilePage
- WHEN the save request fails
- THEN toast shows "Error al guardar"
- AND form remains editable with previous values

### R-4: Avatar URL Migration

The system MUST add `avatar_url TEXT` (nullable) column to `profiles`.

#### Scenario: Existing profiles unaffected

- GIVEN existing rows in `profiles`
- WHEN migration `ALTER TABLE perfiles ADD COLUMN avatar_url TEXT` runs
- THEN all existing rows have `avatar_url = NULL`
- AND no data is lost

## Acceptance Criteria

- [ ] Avatar upload with preview, file validation (size + type)
- [ ] Storage bucket `avatars` with user-folder RLS
- [ ] Profile fields (full_name, phone, document_id) editable
- [ ] `avatar_url` column migration
- [ ] Initials fallback when no avatar
- [ ] `npm run build` passes, `npm run test` passes

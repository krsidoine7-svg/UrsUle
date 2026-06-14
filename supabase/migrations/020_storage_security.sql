-- ═══════════════════════════════════════════════════════════════════
-- Migration 020 : Sécurité du Stockage (Supabase Storage)
-- ═══════════════════════════════════════════════════════════════════
-- Cette migration crée automatiquement le bucket pour les pièces 
-- jointes et verrouille les accès via RLS pour empêcher tout 
-- écrasement ou suppression non autorisée de fichiers.

-- 1. Création du bucket 'task-attachments' (public pour générer des URL signées/publiques)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- (RLS est déjà actif par défaut sur les buckets Supabase)

-- 3. LECTURE : Tout le monde peut voir les fichiers du bucket (Bucket Public)
DROP POLICY IF EXISTS "Public Read Access task-attachments" ON storage.objects;
CREATE POLICY "Public Read Access task-attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-attachments' );

-- 4. UPLOAD : Les utilisateurs authentifiés ne peuvent uploader que dans LEUR dossier
-- L'application envoie les fichiers sous la forme : {user_id}/{task_id}/{filename}
-- On vérifie que le premier dossier correspond bien à l'ID de l'utilisateur.
DROP POLICY IF EXISTS "Authenticated Uploads task-attachments" ON storage.objects;
CREATE POLICY "Authenticated Uploads task-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. UPDATE : Les utilisateurs ne peuvent modifier que leurs propres fichiers
DROP POLICY IF EXISTS "Authenticated Updates task-attachments" ON storage.objects;
CREATE POLICY "Authenticated Updates task-attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. DELETE : Les utilisateurs ne peuvent supprimer que leurs propres fichiers
DROP POLICY IF EXISTS "Authenticated Deletes task-attachments" ON storage.objects;
CREATE POLICY "Authenticated Deletes task-attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

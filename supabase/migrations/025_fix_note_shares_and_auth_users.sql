-- ==========================================
-- 025_fix_note_shares_and_auth_users.sql
-- Correction de l'erreur 'permission denied for table users' 
-- en remplaçant les requêtes directes vers auth.users par public.profiles et le JWT
-- ==========================================

-- 1. Supprimer l'ancienne politique RLS qui interrogeait directement auth.users
DROP POLICY IF EXISTS "collaborator_view_shares" ON public.note_shares;

-- 2. Créer la politique sécurisée utilisant le JWT et public.profiles
CREATE POLICY "collaborator_view_shares" ON public.note_shares
  FOR SELECT TO authenticated
  USING (
    email IS NOT NULL AND 
    (email = (auth.jwt() ->> 'email') OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())) AND
    permission != 'none' AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- 3. Remplacer les contraintes FK pointant vers auth.users par public.profiles si applicable
DO $$
BEGIN
  ALTER TABLE public.note_shares DROP CONSTRAINT IF EXISTS note_shares_owner_id_fkey;
  ALTER TABLE public.note_shares ADD CONSTRAINT note_shares_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Impossible de modifier note_shares_owner_id_fkey: %', SQLERRM;
END
$$;

DO $$
BEGIN
  ALTER TABLE public.note_comments DROP CONSTRAINT IF EXISTS note_comments_user_id_fkey;
  ALTER TABLE public.note_comments ADD CONSTRAINT note_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Impossible de modifier note_comments_user_id_fkey: %', SQLERRM;
END
$$;

-- 4. Remplacer la fonction get_shared_note_by_token pour qu'elle interroge public.profiles au lieu de auth.users
CREATE OR REPLACE FUNCTION public.get_shared_note_by_token(token_or_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_note RECORD;
  v_owner_name TEXT;
  v_content TEXT;
BEGIN
  -- 1. Trouver le partage valide
  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission != 'none'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '404: Note partagée introuvable ou lien expiré.';
  END IF;

  -- 2. Récupérer la note non supprimée
  SELECT * INTO v_note
  FROM public.notes
  WHERE id = v_share.note_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION '404: La note originale a été supprimée ou n''est plus disponible.';
  END IF;

  -- 3. Récupérer le nom ou email du propriétaire depuis public.profiles (sûr et sans erreur de permission)
  SELECT COALESCE(full_name, email, 'Propriétaire') INTO v_owner_name
  FROM public.profiles
  WHERE id = v_note.user_id;

  v_content := v_note.content;

  -- 4. Si le demandeur n'est pas le propriétaire authentifié, purger les sections restreintes (data-restricted="true") côté serveur
  IF auth.uid() IS NULL OR auth.uid() != v_note.user_id THEN
    v_content := regexp_replace(
      v_content,
      '<[^>]+data-restricted=["'']true["''][^>]*>.*?<\/[a-zA-Z0-9]+>',
      '<div class="p-3 my-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs font-semibold flex items-center gap-2 select-none" data-restricted-placeholder="true">🔒 [Section restreinte — accès limité par le propriétaire]</div>',
      'gi'
    );
  END IF;

  RETURN jsonb_build_object(
    'note', jsonb_build_object(
      'id', v_note.id,
      'title', v_note.title,
      'content', v_content,
      'tags', v_note.tags,
      'updated_at', v_note.updated_at
    ),
    'share', jsonb_build_object(
      'id', v_share.id,
      'permission', v_share.permission,
      'allowed_views', v_share.allowed_views,
      'target_block_id', v_share.target_block_id,
      'custom_slug', v_share.custom_slug
    ),
    'owner_name', COALESCE(v_owner_name, 'Utilisateur UrsUle')
  );
END;
$$;

-- ==========================================
-- 024_note_shares.sql
-- Partage de notes avec permissions granulaires, restrictions par vue et blocs
-- ==========================================

-- 1. Table des partages et invitations (liens publics et collaborateurs par e-mail)
CREATE TABLE IF NOT EXISTS public.note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NULL,
  share_token VARCHAR(64) UNIQUE NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  custom_slug VARCHAR(100) UNIQUE NULL,
  target_block_id VARCHAR(100) NULL,
  permission VARCHAR(20) NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'comment', 'write', 'none')),
  allowed_views JSONB NOT NULL DEFAULT '{"note": true, "graph": true, "mindmap": true, "flashcards": true}'::jsonb,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibilité ascendante si la table note_shares existait déjà auparavant sans ces colonnes
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE NULL DEFAULT encode(gen_random_bytes(32), 'hex');
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS custom_slug VARCHAR(100) UNIQUE NULL;
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS target_block_id VARCHAR(100) NULL;
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS permission VARCHAR(20) NOT NULL DEFAULT 'read';
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS allowed_views JSONB NOT NULL DEFAULT '{"note": true, "graph": true, "mindmap": true, "flashcards": true}'::jsonb;
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

-- 2. Table des commentaires sur les notes partagées
CREATE TABLE IF NOT EXISTS public.note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name VARCHAR(100) NOT NULL DEFAULT 'Anonyme',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Compatibilité ascendante pour note_comments
ALTER TABLE public.note_comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(100) NOT NULL DEFAULT 'Anonyme';
ALTER TABLE public.note_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- 3. Index de performance
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON public.note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_owner_id ON public.note_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_token ON public.note_shares(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_shares_slug ON public.note_shares(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_comments_note_id ON public.note_comments(note_id) WHERE deleted_at IS NULL;

-- 4. Row Level Security (RLS)
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

-- RLS: Propriétaire a tous les droits sur ses partages
CREATE POLICY "owner_manage_shares" ON public.note_shares
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS: Les invités par email authentifiés voient les partages qui leur sont adressés et valides
CREATE POLICY "collaborator_view_shares" ON public.note_shares
  FOR SELECT TO authenticated
  USING (
    email IS NOT NULL AND 
    (email = (auth.jwt() ->> 'email') OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())) AND
    permission != 'none' AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- RLS: Propriétaire de la note a tous les droits sur les commentaires associés
CREATE POLICY "owner_manage_note_comments" ON public.note_comments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_comments.note_id AND n.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_comments.note_id AND n.user_id = auth.uid()));

-- RLS: Un utilisateur authentifié peut modifier ou supprimer ses propres commentaires
CREATE POLICY "user_manage_own_comments" ON public.note_comments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ==========================================
-- FONCTIONS RPC SECURITY DEFINER (Accès public via token ou slug sans exposer les tables)
-- Protection stricte : SET search_path = public
-- ==========================================

-- 1. Récupérer une note partagée par token ou custom_slug
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

  -- 3. Récupérer le nom ou email du propriétaire depuis public.profiles
  SELECT COALESCE(full_name, email, 'Propriétaire') INTO v_owner_name
  FROM public.profiles
  WHERE id = v_note.user_id;

  v_content := v_note.content;

  -- 4. Si le demandeur n'est pas le propriétaire authentifié, purger les sections restreintes (data-restricted="true") côté serveur !
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


-- 2. Mettre à jour une note partagée via token (Si permission 'write')
CREATE OR REPLACE FUNCTION public.update_shared_note_by_token(token_or_slug TEXT, new_title TEXT, new_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
BEGIN
  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission = 'write'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '403: Permission insuffisante ou lien invalide/expiré pour modifier cette note.';
  END IF;

  UPDATE public.notes
  SET title = COALESCE(new_title, title),
      content = COALESCE(new_content, content),
      updated_at = NOW()
  WHERE id = v_share.note_id AND deleted_at IS NULL;

  RETURN jsonb_build_object('success', true, 'updated_at', NOW());
END;
$$;


-- 3. Récupérer les commentaires d'une note partagée
CREATE OR REPLACE FUNCTION public.get_shared_note_comments_by_token(token_or_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_comments JSONB;
BEGIN
  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission IN ('read', 'comment', 'write')
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '404: Note partagée introuvable ou lien expiré.';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'author_name', c.author_name,
      'content', c.content,
      'created_at', c.created_at,
      'is_owner', (c.user_id = v_share.owner_id)
    ) ORDER BY c.created_at ASC
  ), '[]'::jsonb) INTO v_comments
  FROM public.note_comments c
  WHERE c.note_id = v_share.note_id AND c.deleted_at IS NULL;

  RETURN v_comments;
END;
$$;


-- 4. Ajouter un commentaire via token (Si permission 'comment' ou 'write')
CREATE OR REPLACE FUNCTION public.create_shared_note_comment_by_token(token_or_slug TEXT, author_name_param TEXT, content_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_new_comment RECORD;
BEGIN
  IF COALESCE(trim(content_param), '') = '' THEN
    RAISE EXCEPTION 'Le contenu du commentaire ne peut pas être vide.';
  END IF;

  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission IN ('comment', 'write')
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '403: Vous n''avez pas l''autorisation de commenter sur cette note.';
  END IF;

  INSERT INTO public.note_comments (note_id, user_id, author_name, content)
  VALUES (
    v_share.note_id,
    auth.uid(),
    COALESCE(NULLIF(trim(author_name_param), ''), 'Anonyme'),
    content_param
  )
  RETURNING id, author_name, content, created_at INTO v_new_comment;

  RETURN jsonb_build_object(
    'id', v_new_comment.id,
    'author_name', v_new_comment.author_name,
    'content', v_new_comment.content,
    'created_at', v_new_comment.created_at,
    'is_owner', (auth.uid() IS NOT NULL AND auth.uid() = v_share.owner_id)
  );
END;
$$;


-- 5. Récupérer le sous-graphe des notes liées à une note partagée (Si vue 'graph' autorisée)
CREATE OR REPLACE FUNCTION public.get_shared_note_graph_by_token(token_or_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_nodes JSONB;
  v_edges JSONB;
BEGIN
  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission != 'none'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '404: Note partagée introuvable ou lien expiré.';
  END IF;

  IF COALESCE((v_share.allowed_views->>'graph')::boolean, true) = false THEN
    RAISE EXCEPTION '403: La vue Graphe a été restreinte par le propriétaire du document.';
  END IF;

  SELECT jsonb_build_array(
    jsonb_build_object(
      'id', n.id,
      'label', n.title,
      'group', 'main',
      'folder_id', n.folder_id
    )
  ) INTO v_nodes
  FROM public.notes n
  WHERE n.id = v_share.note_id;

  v_edges := '[]'::jsonb;

  RETURN jsonb_build_object('nodes', COALESCE(v_nodes, '[]'::jsonb), 'edges', v_edges);
END;
$$;


-- 6. Récupérer les flashcards associées à une note partagée (Si vue 'flashcards' autorisée)
CREATE OR REPLACE FUNCTION public.get_shared_note_flashcards_by_token(token_or_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_cards JSONB;
BEGIN
  SELECT * INTO v_share
  FROM public.note_shares
  WHERE (share_token = token_or_slug OR custom_slug = token_or_slug)
    AND permission != 'none'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION '404: Note partagée introuvable ou lien expiré.';
  END IF;

  IF COALESCE((v_share.allowed_views->>'flashcards')::boolean, true) = false THEN
    RAISE EXCEPTION '403: La vue Flashcards a été restreinte par le propriétaire du document.';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', f.id,
      'question', f.question,
      'answer', f.answer,
      'created_at', f.created_at
    ) ORDER BY f.created_at ASC
  ), '[]'::jsonb) INTO v_cards
  FROM public.flashcards f
  WHERE f.note_id = v_share.note_id AND f.deleted_at IS NULL;

  RETURN v_cards;
END;
$$;

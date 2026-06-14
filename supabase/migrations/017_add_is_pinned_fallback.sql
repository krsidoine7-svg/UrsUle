-- Migration de sécurité : S'assurer que la colonne is_pinned existe bien.
-- Si la base de données a été initialisée avec une ancienne version du schéma, 
-- cette colonne pourrait manquer, causant l'échec silencieux de l'épinglage.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

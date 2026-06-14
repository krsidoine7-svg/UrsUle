-- Migration 021 : Dynamic App Settings & Admin Role

-- 1. Ajout du flag is_admin dans la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- On met krsidoine7@gmail.com comme admin si le profil existe déjà
UPDATE public.profiles SET is_admin = true WHERE email = 'krsidoine7@gmail.com';

-- 2. Création de la table app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_name TEXT NOT NULL DEFAULT 'UrsUle',
  app_subtitle TEXT NOT NULL DEFAULT 'Le gestionnaire de tâches premium pour les jeunes entrepreneurs ambitieux.',
  quote TEXT NOT NULL DEFAULT '« Chaque grande réussite commence par la décision d''essayer. »',
  author_name TEXT NOT NULL DEFAULT 'Krsidoine',
  github_url TEXT NOT NULL DEFAULT 'https://github.com/krsidoine7-svg/UrsUle',
  github_text TEXT NOT NULL DEFAULT 'krsidoine7-svg/UrsUle',
  email_url TEXT NOT NULL DEFAULT 'mailto:krsidoine7@gmail.com',
  email_text TEXT NOT NULL DEFAULT 'krsidoine7@gmail.com',
  whatsapp_url TEXT NOT NULL DEFAULT 'https://wa.me/2250503681588',
  whatsapp_text TEXT NOT NULL DEFAULT '+225 05 03 68 15 88',
  portfolio_links JSONB NOT NULL DEFAULT '[
    {"label": "Ofika.ci", "url": "https://ofika.ci/"},
    {"label": "Orla-nou", "url": "https://orla-nou.vercel.app/"},
    {"label": "Menlyla.ci", "url": "https://manly-chi.vercel.app/"},
    {"label": "Ofika Gourmet - Menu Digital", "url": "https://manly-chi.vercel.app/ofika-gournet"},
    {"label": "Portfolio", "url": "https://ofika.ci/krsidoine7"},
    {"label": "Sign Ofika", "url": "https://sign-ofika.vercel.app/"}
  ]'::jsonb,
  copyright TEXT NOT NULL DEFAULT '© 2026 UrsUle — Tous droits réservés',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation avec une seule ligne
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_single_row CHECK (id = 1);

-- 3. Insertion de la donnée par défaut (si elle n'existe pas)
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique : Tout le monde peut lire la config
CREATE POLICY "Lecture publique de la configuration" 
  ON public.app_settings FOR SELECT 
  USING (true);

-- Mise à jour : Uniquement pour les admins
CREATE POLICY "Admins peuvent modifier la configuration" 
  ON public.app_settings FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Bloquer INSERT et DELETE
CREATE POLICY "Bloquer INSERT configuration" ON public.app_settings FOR INSERT WITH CHECK (false);
CREATE POLICY "Bloquer DELETE configuration" ON public.app_settings FOR DELETE USING (false);

-- 5. Trigger pour les futurs administrateurs (au cas où krsidoine7@gmail.com s'inscrit après cette migration)
CREATE OR REPLACE FUNCTION set_admin_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'krsidoine7@gmail.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- On attache ce trigger à profiles pour s'assurer que c'est traité au moment de l'insertion
DROP TRIGGER IF EXISTS on_profile_created_set_admin ON public.profiles;
CREATE TRIGGER on_profile_created_set_admin
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_admin_on_signup();

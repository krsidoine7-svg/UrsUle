-- Fonction pour créer les catégories système au premier login
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_system, sort_order) VALUES
    (p_user_id, 'Personnel',     '#3B82F6', 'user',        TRUE, 1),
    (p_user_id, 'Travail',       '#2563EB', 'briefcase',   TRUE, 2),
    (p_user_id, 'Apprentissage', '#8B5CF6', 'book-open',   TRUE, 3),
    (p_user_id, 'Finance',       '#16A34A', 'dollar-sign', TRUE, 4),
    (p_user_id, 'Santé',         '#EF4444', 'heart',       TRUE, 5),
    (p_user_id, 'Projets',       '#F59E0B', 'folder-open', TRUE, 6);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appel automatique après création de profil (Mise à jour du trigger précédent)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  PERFORM create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

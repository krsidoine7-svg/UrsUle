# 🤖 GEMINI.md — Instructions de Sessions & Suivi de Projet (UrsUle)
Ce fichier sert de point de repère principal pour les futures sessions de travail avec Gemini/Antigravity sur l'application **UrsUle**. Il permet de reprendre instantanément le projet là où il s'est arrêté avec tout le contexte nécessaire.

---

## 📌 Présentation Globale du Projet
* **Nom du Projet** : UrsUle
* **Description** : Gestionnaire d'agenda et de tâches intelligent, intuitif, visuellement fort et gamifié (avec défis de validation et suivi d'appréciation/humeur).
* **Timezone par défaut** : `Africa/Abidjan` (GMT+0)
* **Stack Technique** :
  * **Frontend** : Vue 3, TypeScript, Vite, Tailwind CSS v3, shadcn-vue.
  * **State Management & Routage** : Pinia, Vue Router.
  * **Base de Données & Services** : Supabase (PostgreSQL, Supabase Auth, Supabase Storage).
  * **Librairies additionnelles** : Chart.js (Statistiques), FullCalendar (Calendrier), Tiptap (Éditeur riche), vue-draggable-plus (Kanban Drag-and-drop), jsPDF/xlsx (Exports).

---

## 🚀 État d'Avancement du MVP V1
Le code applicatif et l'architecture frontend sont **intégralement finalisés et structurés** :
* **Authentification (F-01)** : Pages Inscription, Connexion et Oubli de mot de passe liées à Supabase Auth.
* **Dashboard (F-02)** : Vue avec widgets de productivité quotidienne, citations motivationnelles et streaks.
* **Tâches CRUD & Éditeur Riche (F-03, F-05, F-16)** : Formulaire en slide-over, édition inline des titres/statuts, gestion d'épinglage, corbeille et éditeur WYSIWYG Tiptap (Markdown).
* **Checklists & Sous-tâches (F-04)** : Liste hiérarchique avec barre de progression dynamique.
* **Timer & Chrono (F-07)** : Widget de décompte Pomodoro et de chronomètre persistants en arrière-plan.
* **Validation & Humeur (F-08, F-09)** : Mini-défis de calcul mental lors de la complétion et modal d'appréciation emoji (humeur post-tâche).
* **Vues Multiples** : Vue Tableau standard, Grille responsive, Kanban avec Drag-and-drop et Calendrier complet.
* **Gestion de Projets (F-10)** : Liste des projets, vue détail avec timeline et progression automatique.
* **Statistiques (F-11)** : Rapports visuels interactifs avec Chart.js.
* **Exports & Médias (F-12, F-13)** : PDF avec mise en page, Excel, JSON, et gestion des uploads d'images.
* **Webhooks (F-15)** : logs de webhooks et liaisons configurées ( Make.com).
* **Google Drive Sync (F-14)** : Connexion OAuth Google, sauvegarde JSON (tâches, projets, PKM) et restauration fonctionnelles.
* **Brain & PKM (F-17)** : Interface Plein Écran immersive avec panneaux latéraux et supérieurs entièrement rétractables (onglets de couleur).
* **Graphe de Connaissances** : Implémentation de 3 modes de visualisation distincts (Tout, Libres en grille, Réseau) avec centrage dynamique et suppression du bruit visuel pour une ergonomie maximale. Code testé et prêt pour la production (build validé).
* **Sécurité & Audit (Production Ready)** : Faille SSRF patchée sur l'Edge Function, protection XSS renforcée sur l'éditeur Tiptap (`DOMPurify`), durcissement du Row Level Security (RLS) sur toutes les tables secondaires (Migration `022`), correction des vulnérabilités de `search_path` (Security Definer), et automatisation sécurisée du bucket Storage.
* **Journal Quotidien (BRAIN-F08)** : Éditeur Tiptap, mini-calendrier avec points d'écriture, streaks, mots de la semaine, heatmap d'activité annuelle (style GitHub), exports Markdown/PDF, chimes audio (Web Audio API) et Service Worker de notifications push.
* **Recherche Globale (BRAIN-F09)** : Modal interactif `Cmd+K` / `Ctrl+K` avec recherche plein texte Postgres, debounce de 200 ms, navigation au clavier (flèches + Entrée) et barre de filtrage de type ("Notes" vs "Journaux") dans la liste des notes.

---

## 🔑 Configuration & Base de Données
### Variables d'Environnement
Le fichier [`.env.local`](.env.local) est à jour avec les informations de votre nouveau projet Supabase actif :
* **Supabase URL** : `https://xptwxsuqjnlwjrzytvpj.supabase.co`
* **Supabase Anon / Publishable Key** : `sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS`

### Initialisation de la Base de Données
Pour faire fonctionner le projet, le schéma doit être appliqué sur votre nouveau projet Supabase. Les fichiers SQL sont tous prêts dans le dossier :
📂 [`supabase/migrations/`](supabase/migrations/)

**Ordre d'exécution recommandé dans le SQL Editor de Supabase** :
1. [`001_init_schema.sql`](supabase/migrations/001_init_schema.sql) (Création des tables, indexes et du trigger d'inscription automatique)
2. [`002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql) (Règles RLS)
3. [`003_default_categories.sql`](supabase/migrations/003_default_categories.sql) (Données des catégories initiales)
4. [`004_security_hardening.sql`](supabase/migrations/004_security_hardening.sql) (Durcissement sécurité)
5. [`005_default_user_id.sql`](supabase/migrations/005_default_user_id.sql)
6. [`006_task_sort_order.sql`](supabase/migrations/006_task_sort_order.sql)
7. [`007_notifications.sql`](supabase/migrations/007_notifications.sql)
8. [`008_webhook_logs.sql`](supabase/migrations/008_webhook_logs.sql)
9. [`009_sync_webhook_logs.sql`](supabase/migrations/009_sync_webhook_logs.sql)
10. [`010_enable_realtime.sql`](supabase/migrations/010_enable_realtime.sql) (Activation de Supabase Realtime pour la synchronisation automatique)
11. [`011_project_soft_delete_and_indexes.sql`](supabase/migrations/011_project_soft_delete_and_indexes.sql)
12. [`012_brain_schema.sql`](supabase/migrations/012_brain_schema.sql)
13. [`013_soft_delete_folders_flashcards.sql`](supabase/migrations/013_soft_delete_folders_flashcards.sql)
14. [`014_soft_delete_all_secondary_tables.sql`](supabase/migrations/014_soft_delete_all_secondary_tables.sql)
15. [`015_task_recurrence_trigger.sql`](supabase/migrations/015_task_recurrence_trigger.sql) (Gestion de la récurrence automatique des tâches)
16. [`016_automated_notifications.sql`](supabase/migrations/016_automated_notifications.sql) (Planification des notifications automatiques et digest journalier via pg_cron)
17. Edge Function `webhook-dispatcher` déployée et active (Sécurisée contre SSRF).
18. [`018_rls_audit_fixes.sql`](supabase/migrations/018_rls_audit_fixes.sql) (Verrouillage final RLS sur les tables secondaires et désactivation de l'accès public).
19. [`019_search_path_fixes.sql`](supabase/migrations/019_search_path_fixes.sql) (Protection des fonctions *Security Definer* contre les injections de Search Path).
20. [`020_storage_security.sql`](supabase/migrations/020_storage_security.sql) (Création et sécurisation stricte du bucket `task-attachments` via RLS).
21. [`022_database_security_fixes.sql`](supabase/migrations/022_database_security_fixes.sql) (Correctifs d'authentification GoTrue, search_path, et durcissement RLS global).

---

## 🏃‍♂️ Comment lancer l'application en local ?
1. S'assurer que les dépendances sont installées :
   ```bash
   npm install
   ```
2. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
3. L'application est alors accessible à l'adresse : **[http://localhost:5173/](http://localhost:5173/)**

---

## 📋 Prochaines Actions suggérées
- [ ] Valider le flux complet d'inscription utilisateur en local avec la migration `022` appliquée.
- [ ] Configurer la clé publique VAPID dans l'Edge Function pour le push système complet.


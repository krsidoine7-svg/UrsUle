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

---

## 🔑 Configuration & Base de Données
### Variables d'Environnement
Le fichier [`.env.local`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/.env.local) est à jour avec les informations de votre nouveau projet Supabase actif :
* **Supabase URL** : `https://xptwxsuqjnlwjrzytvpj.supabase.co`
* **Supabase Anon / Publishable Key** : `sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS`

### Initialisation de la Base de Données
Pour faire fonctionner le projet, le schéma doit être appliqué sur votre nouveau projet Supabase. Les fichiers SQL sont tous prêts dans le dossier :
📂 [`supabase/migrations/`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations)

**Ordre d'exécution recommandé dans le SQL Editor de Supabase** :
1. [`001_init_schema.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/001_init_schema.sql) (Création des tables, indexes et du trigger d'inscription automatique)
2. [`002_rls_policies.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/002_rls_policies.sql) (Règles RLS)
3. [`003_default_categories.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/003_default_categories.sql) (Données des catégories initiales)
4. [`004_security_hardening.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/004_security_hardening.sql) (Durcissement sécurité)
5. [`005_default_user_id.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/005_default_user_id.sql)
6. [`006_task_sort_order.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/006_task_sort_order.sql)
7. [`007_notifications.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/007_notifications.sql)
8. [`008_webhook_logs.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/008_webhook_logs.sql)
9. [`009_sync_webhook_logs.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/009_sync_webhook_logs.sql)
10. [`010_enable_realtime.sql`](file:///c:/Users/Toto.ADMINISTRATOR/Desktop/UrsUle-main/supabase/migrations/010_enable_realtime.sql) (Activation de Supabase Realtime pour la synchronisation automatique)

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
- [ ] Exécuter les scripts de migrations SQL de `001` à `010` sur la console Supabase (SQL Editor).
- [ ] Tester l'inscription d'un nouvel utilisateur depuis l'interface locale.
- [ ] Configurer un seau (bucket) public nommé `task-images` dans le menu **Storage** du tableau de bord Supabase pour activer la gestion des images.


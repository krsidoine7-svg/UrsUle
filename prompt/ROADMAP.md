# 🗺️ ROADMAP — UrsUle
**Planning de développement feature by feature**  
**Approche :** Tester et valider chaque feature avant de passer à la suivante

---

## PHASE 0 — SETUP & FONDATIONS ⚙️
*Durée estimée : 2-3 jours*  
*Objectif : Avoir un projet qui tourne en local et sur Vercel*

### SPRINT 0.1 — Initialisation Projet
- [ ] **0.1.1** Créer le projet Vue 3 + Vite + TypeScript
  ```bash
  npm create vue@latest ursule -- --typescript --router --pinia
  ```
- [ ] **0.1.2** Installer et configurer Tailwind CSS v3
- [ ] **0.1.3** Installer shadcn-vue et initialiser la config
- [ ] **0.1.4** Installer lucide-vue-next
- [ ] **0.1.5** Configurer les alias `@/` dans vite.config.ts
- [ ] **0.1.6** Créer le repo GitHub et lier à Vercel
- [ ] **0.1.7** Premier déploiement Vercel (page blanche = OK)

**✅ Critère de validation :** L'URL Vercel affiche l'app sans erreur

---

### SPRINT 0.2 — Supabase Setup
- [ ] **0.2.1** Créer le projet Supabase (région : EU West pour RGPD)
- [ ] **0.2.2** Configurer les variables d'environnement (`.env.local`)
- [ ] **0.2.3** Installer `@supabase/supabase-js`
- [ ] **0.2.4** Créer `src/services/supabase.ts` (client typé)
- [ ] **0.2.5** Exécuter la migration `001_init_schema.sql` (toutes les tables)
- [ ] **0.2.6** Exécuter `002_rls_policies.sql`
- [ ] **0.2.7** Ajouter les variables Supabase dans Vercel

**✅ Critère de validation :** Connexion Supabase réussie depuis le code (console.log du client)

---

## PHASE 1 — AUTHENTIFICATION 🔐
*Durée estimée : 2-3 jours*  
*Feature : F-01*

### SPRINT 1.1 — Pages Auth
- [ ] **1.1.1** Créer `LoginView.vue` (email + password + lien inscription)
- [ ] **1.1.2** Créer `RegisterView.vue` (nom + email + password)
- [ ] **1.1.3** Créer `ForgotPasswordView.vue`
- [ ] **1.1.4** Créer `auth.service.ts` (signIn, signUp, signOut, resetPassword)
- [ ] **1.1.5** Créer `auth.store.ts` (Pinia : user, session, loading)
- [ ] **1.1.6** Configurer le router guard (routes protégées)
- [ ] **1.1.7** Trigger Supabase : création profil auto après inscription
- [ ] **1.1.8** Style : logo UrsUle + couleurs bleu/vert forêt/blanc

**✅ Critère de validation :**
- Créer un compte avec krsidoine7@gmail.com → email de confirmation reçu
- Se connecter → redirigé vers dashboard (vide pour l'instant)
- Accéder à /tasks sans être connecté → redirigé vers /login

---

## PHASE 2 — DASHBOARD 🏠
*Durée estimée : 2 jours*  
*Feature : F-02*

### SPRINT 2.1 — Layout Principal
- [ ] **2.1.1** Créer `AppSidebar.vue` (navigation : Dashboard, Tâches, Projets, Calendrier, Stats, Paramètres)
- [ ] **2.1.2** Créer `AppHeader.vue` (logo, user avatar, notif cloche, déconnexion)
- [ ] **2.1.3** Layout principal avec sidebar fixe + contenu scrollable
- [ ] **2.1.4** Responsive : sidebar collapsible sur mobile (hamburger)

### SPRINT 2.2 — Widgets Dashboard
- [ ] **2.2.1** Widget "Tâches du jour" (compte, liste rapide)
- [ ] **2.2.2** Widget "En retard" (badge rouge)
- [ ] **2.2.3** Widget "Cette semaine" (barre de progression)
- [ ] **2.2.4** Citation motivationnelle du jour (liste hardcodée)
- [ ] **2.2.5** Bouton rapide "Créer une tâche"
- [ ] **2.2.6** Indicateur streak (jours consécutifs)

**✅ Critère de validation :**
- Le dashboard affiche les widgets avec des données (même vides/0)
- La sidebar permet de naviguer entre les sections
- Sur mobile, la sidebar se replie correctement

---

## PHASE 3 — CATÉGORIES 🏷️
*Durée estimée : 1 jour*  
*Feature : F-06*

- [ ] **3.1** `categories.service.ts` (CRUD)
- [ ] **3.2** `categories.store.ts` (Pinia)
- [ ] **3.3** Insérer les 6 catégories système au premier login
- [ ] **3.4** Page Paramètres → section Catégories (CRUD visuel)
- [ ] **3.5** `CategoryBadge.vue` (badge coloré réutilisable)

**✅ Critère de validation :**
- Les 6 catégories système existent dès la connexion
- Créer une catégorie "Vidéo" avec couleur rouge → apparaît dans la liste
- Supprimer une catégorie personnalisée → confirmée
- Les catégories système ne peuvent pas être supprimées

---

## PHASE 4 — GESTION DES TÂCHES 📝
*Durée estimée : 5-7 jours*  
*Feature : F-03*

### SPRINT 4.1 — CRUD de base
- [ ] **4.1.1** `tasks.service.ts` (getAll, getById, create, update, softDelete)
- [ ] **4.1.2** `tasks.store.ts` (Pinia avec computed : todayTasks, urgentTasks)
- [ ] **4.1.3** `TaskForm.vue` (slide-over panel, champs : titre, deadline, priorité, catégorie)
- [ ] **4.1.4** `TaskList.vue` (vue tableau basique, colonnes : titre, statut, priorité, deadline)
- [ ] **4.1.5** `TaskCard.vue` (composant carte réutilisable)
- [ ] **4.1.6** `PriorityBadge.vue` (badge coloré par priorité)
- [ ] **4.1.7** `TasksView.vue` (page principale avec le tableau)

### SPRINT 4.2 — Fonctionnalités avancées
- [ ] **4.2.1** `TaskDetail.vue` (slide-over détail complet)
- [ ] **4.2.2** Édition inline du titre et statut
- [ ] **4.2.3** Ajout de tags libres (input + chips)
- [ ] **4.2.4** Épingler une tâche (pin icon + tri en tête)
- [ ] **4.2.5** Dupliquer une tâche
- [ ] **4.2.6** Corbeille (liste des tâches supprimées, restauration, suppression définitive)
- [ ] **4.2.7** Sauvegarde auto brouillon (localStorage, toutes les 30s)

### SPRINT 4.3 — Filtres & Recherche
- [ ] **4.3.1** Barre de recherche avec debounce 300ms
- [ ] **4.3.2** Filtres : statut, priorité, catégorie, date
- [ ] **4.3.3** Tri : par deadline, priorité, création, titre
- [ ] **4.3.4** Persistance des filtres (URL query params)

**✅ Critère de validation :**
- Créer une tâche "Test UrsUle" avec deadline demain, priorité Haute → visible dans le tableau
- Modifier le titre en cliquant dessus → sauvegardé
- Changer le statut via dropdown → sauvegardé
- Supprimer la tâche → va dans la corbeille
- Restaurer depuis la corbeille → réapparaît
- Filtrer par "Urgent" → seules les tâches urgentes s'affichent
- Rechercher "Test" → trouve la tâche

---

## PHASE 5 — ÉDITEUR DE TEXTE RICHE ✍️
*Durée estimée : 2 jours*  
*Feature : F-16*

- [ ] **5.1** Installer Tiptap 2 + extensions (StarterKit, Markdown, Table, Link)
- [ ] **5.2** `RichTextEditor.vue` (toolbar : H1/H2, gras, italique, listes, code, liens)
- [ ] **5.3** Toggle Markdown brut / Rendu visuel
- [ ] **5.4** Intégrer dans `TaskForm.vue` (champ description)
- [ ] **5.5** Intégrer dans `TaskDetail.vue` (édition inline)
- [ ] **5.6** Rendu Markdown dans les vues lecture

**✅ Critère de validation :**
- Écrire "# Mon titre" dans la description → rendu comme H1
- Sélectionner du texte + clic Gras → texte en **gras**
- Créer une liste à puces avec 3 items → rendu correct
- Toggle Markdown → affiche le code brut
- Toggle retour → affiche le rendu

---

## PHASE 6 — SOUS-TÂCHES & CHECKLISTS ✅
*Durée estimée : 2 jours*  
*Feature : F-04*

- [ ] **6.1** `SubTaskList.vue` (liste de checkboxes dans le détail)
- [ ] **6.2** Ajouter/supprimer des sous-tâches
- [ ] **6.3** Barre de progression parent (calcul auto %)
- [ ] **6.4** Drag & drop pour réordonner les sous-tâches
- [ ] **6.5** Statut sous-tâche dans la vue liste (indicateur "3/5")

**✅ Critère de validation :**
- Ajouter 3 sous-tâches à une tâche → affichées sous la tâche
- Cocher 2/3 → barre de progression à 66%
- Réordonner par DnD → ordre sauvegardé

---

## PHASE 7 — VUES D'AFFICHAGE 👁️
*Durée estimée : 4-5 jours*  
*Feature : F-05*

### Sprint 7.1 — Vue Grille
- [ ] **7.1.1** `TaskGrid.vue` (cards en grille 3-4 colonnes responsive)
- [ ] **7.1.2** Switcher de vue (icons : list, grid, calendar, kanban)
- [ ] **7.1.3** Persistance de la vue préférée (localStorage)

### Sprint 7.2 — Vue Kanban
- [ ] **7.2.1** `TaskKanban.vue` (colonnes : À faire, En cours, Terminé, Reporté)
- [ ] **7.2.2** Drag & Drop entre colonnes (vue-draggable-plus)
- [ ] **7.2.3** Ajout rapide de tâche depuis une colonne
- [ ] **7.2.4** Compteur de tâches par colonne

### Sprint 7.3 — Vue Calendrier
- [ ] **7.3.1** Installer @fullcalendar/vue3
- [ ] **7.3.2** `CalendarView.vue` (mois / semaine / jour)
- [ ] **7.3.3** Tâches affichées comme événements colorés
- [ ] **7.3.4** Clic sur événement → ouvre le détail de tâche
- [ ] **7.3.5** Glisser un événement → modifie la deadline

**✅ Critère de validation :**
- Passer de Tableau à Grille → même tâches, layout différent
- En Kanban : glisser une tâche de "À faire" vers "En cours" → statut mis à jour
- En Calendrier : tâche avec deadline demain visible sur le bon jour

---

## PHASE 8 — TIMER & CHRONOMÈTRE ⏱️
*Durée estimée : 2 jours*  
*Feature : F-07*

- [ ] **8.1** `useTimer.ts` composable (start, pause, stop, reset, currentTime)
- [ ] **8.2** `TimerWidget.vue` (affichage MM:SS, boutons start/pause/stop)
- [ ] **8.3** Timer décompte (Pomodoro) : entrer durée → compte à rebours
- [ ] **8.4** Chronomètre : montant depuis 0
- [ ] **8.5** Notification browser au terme du timer
- [ ] **8.6** Sauvegarder les sessions dans `time_sessions`
- [ ] **8.7** Afficher temps total par tâche dans le détail

**✅ Critère de validation :**
- Démarrer le chrono sur une tâche → MM:SS s'incrémente
- Changer de vue → chrono continue en fond
- Timer 2 min → notification au bout de 2 min
- Temps total affiché dans la tâche après arrêt

---

## PHASE 9 — VALIDATION GAMIFIÉE 🎮
*Durée estimée : 2 jours*  
*Feature : F-08*

- [ ] **9.1** `ValidationModal.vue` (modal bloquante au clic "Terminer")
- [ ] **9.2** Générateur de calculs : `generateCalcChallenge(priority)` (+ difficile si urgent)
- [ ] **9.3** Questions ouvertes : description textuelle + bouton "J'ai répondu"
- [ ] **9.4** Logique 3 tentatives max → statut "À reprendre"
- [ ] **9.5** Score de validation sauvegardé dans la tâche
- [ ] **9.6** Option "Désactiver validation" dans les paramètres

**✅ Critère de validation :**
- Marquer une tâche Terminée → modal avec calcul s'ouvre
- Réussir le calcul → tâche passe en "Terminé"
- Échouer 3 fois → tâche passe en "À reprendre", badge visible
- Vérifier que la tâche ne peut pas être complétée sans le défi

---

## PHASE 10 — APPRÉCIATION POST-TÂCHE 😊
*Durée estimée : 1 jour*  
*Feature : F-09*

- [ ] **10.1** `AppreciationModal.vue` (après validation réussie, 8 options emoji)
- [ ] **10.2** Auto-close après 5 secondes (enregistre "Neutre")
- [ ] **10.3** Sauvegarder l'appréciation dans la tâche
- [ ] **10.4** Afficher l'emoji d'appréciation dans la liste

**✅ Critère de validation :**
- Après validation → modal d'appréciation apparaît
- Sélectionner "🚀 Super productif" → sauvegardé
- Laisser expirer → "Neutre" sauvegardé
- L'emoji est visible dans la card de tâche

---

## PHASE 11 — PROJETS 📁
*Durée estimée : 3 jours*  
*Feature : F-10*

- [ ] **11.1** `projects.service.ts` (CRUD projets)
- [ ] **11.2** `projects.store.ts`
- [ ] **11.3** `ProjectsView.vue` (liste des projets en grille)
- [ ] **11.4** `ProjectCard.vue` (nom, couleur, % progression, deadline)
- [ ] **11.5** `ProjectForm.vue` (slide-over création/édition)
- [ ] **11.6** `ProjectDetailView.vue` (tâches du projet + onglets : Liste, Kanban)
- [ ] **11.7** Lier une tâche à un projet (select dans TaskForm)
- [ ] **11.8** Calcul progression auto (tâches done / total)

**✅ Critère de validation :**
- Créer un projet "Site E-commerce" → visible dans la liste
- Créer 3 tâches liées au projet → progression à 0%
- Compléter 1 tâche → progression à 33%
- Vue Kanban du projet → tâches du projet uniquement

---

## PHASE 12 — STATISTIQUES 📊
*Durée estimée : 3 jours*  
*Feature : F-11*

- [ ] **12.1** Installer Chart.js + vue-chartjs
- [ ] **12.2** `stats.service.ts` (requêtes SQL agrégées Supabase)
- [ ] **12.3** `StatsView.vue` avec 6 onglets de graphiques
- [ ] **12.4** Graphique : tâches par jour (7 derniers jours) — Line chart
- [ ] **12.5** Graphique : taux de complétion par semaine — Bar chart
- [ ] **12.6** Graphique : répartition par catégorie — Donut chart
- [ ] **12.7** Graphique : humeur/appréciation — Bar chart horizontal
- [ ] **12.8** Graphique : temps passé par projet — Donut chart
- [ ] **12.9** Heatmap calendrier (streak productivité)
- [ ] **12.10** Filtres : date range picker + catégorie + projet

**✅ Critère de validation :**
- Stats → graphique des 7 derniers jours avec vraies données
- Changer la plage de dates → graphiques se mettent à jour
- Exporter le graphique en PNG → fichier téléchargé

---

## PHASE 13 — EXPORT 📤
*Durée estimée : 2 jours*  
*Feature : F-12*

- [ ] **13.1** Installer jsPDF + html2canvas + xlsx
- [ ] **13.2** `useExport.ts` composable
- [ ] **13.3** Export PDF : rapport formaté avec logo UrsUle
- [ ] **13.4** Export Excel : tableau toutes colonnes
- [ ] **13.5** Export JSON : données brutes
- [ ] **13.6** Bouton Export dans `TasksView.vue` (respecte les filtres actifs)

**✅ Critère de validation :**
- Cliquer Export PDF → fichier téléchargé, lisible, avec le logo
- Export Excel → s'ouvre dans Excel/Sheets avec colonnes en français
- Export JSON → fichier valide

---

## PHASE 14 — IMAGES 🖼️
*Durée estimée : 1-2 jours*  
*Feature : F-13*

- [ ] **14.1** Configurer Supabase Storage (bucket `task-images`, public)
- [ ] **14.2** `storage.service.ts` (upload, delete, getUrl)
- [ ] **14.3** `FileUpload.vue` (drag & drop ou clic, preview miniature)
- [ ] **14.4** Galerie dans `TaskDetail.vue`
- [ ] **14.5** Lightbox pour agrandissement
- [ ] **14.6** Limite : 5 images, 5MB chacune (validation frontend)

**✅ Critère de validation :**
- Uploader une image dans une tâche → miniature visible
- Cliquer sur la miniature → lightbox s'ouvre
- Supprimer l'image → disparaît (et supprimée de Storage)

---

## PHASE 15 — RÉCURRENCE 🔄
*Durée estimée : 2 jours*  
*Feature : F-17*

- [ ] **15.1** Champ récurrence dans `TaskForm.vue`
- [ ] **15.2** Logique de génération de la prochaine occurrence (Edge Function ou cron)
- [ ] **15.3** Affichage du badge "Récurrente" sur les tâches
- [ ] **15.4** Modification d'une occurrence : cette occurrence seulement vs toutes les suivantes

**✅ Critère de validation :**
- Créer tâche "Revue journalière" tous les jours → le lendemain, une nouvelle tâche est créée
- Badge "Récurrente" visible sur la tâche

---

## PHASE 16 — NOTIFICATIONS 🔔
*Durée estimée : 1-2 jours*  
*Feature : F-18*

- [ ] **16.1** Demander permission Push Notifications au premier login
- [ ] **16.2** `useNotifications.ts` composable
- [ ] **16.3** Notification 1h avant deadline
- [ ] **16.4** Notification tâche en retard (check quotidien)
- [ ] **16.5** Digest quotidien (8h00 Africa/Abidjan)

---

## PHASE 17 — WEBHOOKS 🔗
*Durée estimée : 2 jours*  
*Feature : F-15*

- [ ] **17.1** Déployer la Edge Function `webhook-dispatcher`
- [ ] **17.2** `webhook.service.ts` (appel depuis le frontend)
- [ ] **17.3** Champ URL webhook dans les paramètres projet et tâche
- [ ] **17.4** Page Logs Webhooks (succès/échec)
- [ ] **17.5** Test de webhook depuis l'UI

---

## PHASE 18 — SYNC GOOGLE DRIVE ☁️
*Durée estimée : 2 jours*  
*Feature : F-14*

- [ ] **18.1** OAuth Google dans Supabase
- [ ] **18.2** `drive.service.ts` (upload JSON vers Drive)
- [ ] **18.3** Sync manuelle depuis les paramètres
- [ ] **18.4** Sync automatique quotidienne (Edge Function cron)
- [ ] **18.5** Afficher la date de dernière sync

---

## PHASE 19 — POLISH & OPTIMISATION 🚀
*Durée estimée : 3 jours*

- [ ] **19.1** Audit performance (Lighthouse > 80)
- [ ] **19.2** Optimisation images (WebP, lazy loading)
- [ ] **19.3** Tests E2E basiques (Cypress ou Playwright)
- [ ] **19.4** Vérification OWASP Top 10
- [ ] **19.5** Animations et micro-interactions finales
- [ ] **19.6** Dark mode (optionnel MVP)
- [ ] **19.7** PWA manifest (installable sur mobile)
- [ ] **19.8** Documentation utilisateur (README)

---

## RÉSUMÉ DES PHASES

| Phase | Feature | Durée | Priorité |
|---|---|---|---|
| 0 | Setup fondations | 3 jours | P0 |
| 1 | Authentification | 3 jours | P0 |
| 2 | Dashboard | 2 jours | P0 |
| 3 | Catégories | 1 jour | P1 |
| 4 | Tâches CRUD | 7 jours | P0 |
| 5 | Éditeur riche | 2 jours | P1 |
| 6 | Sous-tâches | 2 jours | P1 |
| 7 | Vues affichage | 5 jours | P1 |
| 8 | Timer/Chrono | 2 jours | P1 |
| 9 | Validation gamifiée | 2 jours | P1 |
| 10 | Appréciation | 1 jour | P2 |
| 11 | Projets | 3 jours | P1 |
| 12 | Statistiques | 3 jours | P1 |
| 13 | Export | 2 jours | P2 |
| 14 | Images | 2 jours | P2 |
| 15 | Récurrence | 2 jours | P2 |
| 16 | Notifications | 2 jours | P2 |
| 17 | Webhooks | 2 jours | P3 |
| 18 | Google Drive | 2 jours | P3 |
| 19 | Polish | 3 jours | P1 |
| **TOTAL** | | **~51 jours** | |

---

## 🏁 DÉFINITION DE "DONE" PAR FEATURE

Une feature est **DONE** quand :
1. ✅ Le code compile sans erreur
2. ✅ Le test manuel passe (critères d'acceptation cochés)
3. ✅ Aucune régression sur les features précédentes
4. ✅ Le code est committé sur GitHub
5. ✅ Le déploiement Vercel est successful

---
*Roadmap vivante — mise à jour après chaque phase validée*

webhooks make;com pour envoyer des mails https://hook.eu2.make.com/mh1hnwggomr759s4j3fopdwfuslbse6t

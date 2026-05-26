# 🧪 PLAN DE TEST COMPLET — UrsUle (MVP V1)

Ce document sert de protocole officiel de test pour valider, feature par feature, l'application **UrsUle**. Chaque test contient des étapes précises et des critères d'acceptation sous forme de case à cocher.

---

## 🔐 FEATURE 1 : AUTHENTIFICATION & PROFIL (F-01)
> **Objectif :** Garantir que la connexion, l'inscription et la gestion de profil sécurisées par Supabase Auth fonctionnent sans faille.

### 📝 Cas de test 1.1 : Inscription d'un nouvel utilisateur
- [ ] Aller sur la page d'inscription `/register`.
- [ ] Tenter d'inscrire un compte avec un format d'email invalide (ex: `krsidoine7`) → Vérifier qu'une erreur de validation s'affiche.
- [ ] Remplir l'email `krsidoine7@gmail.com`, un mot de passe robuste (min. 6 caractères) et le nom complet "Krsidoine".
- [ ] Valider le formulaire → Vérifier qu'une confirmation s'affiche (redirection ou notification de validation d'email).
- [ ] Consulter la base de données Supabase → Vérifier qu'une ligne correspondante a été automatiquement créée dans la table `profiles` (grâce au trigger PostgreSQL `handle_new_user`).

### 📝 Cas de test 1.2 : Connexion & Protection des routes
- [ ] Aller sur `/login` et saisir des identifiants erronés → Vérifier qu'un message d'erreur clair s'affiche.
- [ ] Se connecter avec les identifiants valides → Vérifier que l'utilisateur est redirigé vers le Dashboard (`/`).
- [ ] Tenter d'accéder manuellement à une route protégée (ex: `/tasks` ou `/projects`) dans un onglet privé non connecté → Vérifier la redirection automatique vers `/login`.
- [ ] Clic sur Déconnexion (Sidebar/Header) → Vérifier le nettoyage du token/session et la redirection immédiate vers `/login`.

---

## 🏠 FEATURE 2 : DASHBOARD PRINCIPAL (F-02)
> **Objectif :** Vérifier la pertinence, la lisibilité et l'affichage temps réel des données de productivité de l'utilisateur.

### 📝 Cas de test 2.1 : Layout & Widgets
- [ ] Se connecter et arriver sur le Dashboard.
- [ ] Vérifier que l'heure affichée correspond bien à la timezone `Africa/Abidjan` (GMT+0).
- [ ] Vérifier la présence des widgets :
  - [ ] Widget "Tâches du jour" (affiche le nombre de tâches échéant aujourd'hui).
  - [ ] Widget "En retard" (affiche le badge rouge avec le compte exact).
  - [ ] Widget "Cette semaine" (affiche la barre de progression).
  - [ ] Widget "Citation" (affiche une citation motivationnelle aléatoire).
  - [ ] Widget "Streak" (affiche le nombre de jours consécutifs d'utilisation).
- [ ] Cliquer sur le bouton rapide "Créer une tâche" → Vérifier qu'il ouvre immédiatement le panel de création.

---

## 📝 FEATURE 3 & 16 : CRUD TÂCHES & ÉDITEUR RICHE (F-03, F-05, F-16)
> **Objectif :** Valider le cycle de vie d'une tâche, l'édition inline, l'éditeur Tiptap et le système de corbeille.

### 📝 Cas de test 3.1 : Création de tâche avec description riche
- [ ] Ouvrir le formulaire de création (Slide-over panel).
- [ ] Remplir le titre "Tâche de test premium".
- [ ] Saisir une description avec l'éditeur Tiptap en utilisant du formatage :
  - [ ] Insérer un titre H1 (ex: `# Spécifications`).
  - [ ] Mettre du texte en **Gras** et *Italique*.
  - [ ] Créer une liste à puces.
- [ ] Définir une priorité (Haute), une catégorie, et une deadline (demain).
- [ ] Enregistrer la tâche → Vérifier qu'elle s'affiche instantanément dans la liste sans recharger la page.

### 📝 Cas de test 3.2 : Édition inline, Épinglage & Duplication
- [ ] Double-cliquer sur le titre de la tâche dans la liste → Vérifier que le champ devient éditable, modifier le titre, presser Entrée → Vérifier la sauvegarde automatique.
- [ ] Cliquer sur l'icône "Épingler" (Pin) → Vérifier que la tâche remonte tout en haut de la liste avec une bordure dorée.
- [ ] Cliquer sur l'option "Dupliquer" dans le menu d'actions → Vérifier qu'une copie parfaite est créée instantanément.

### 📝 Cas de test 3.3 : Corbeille (Soft Delete)
- [ ] Cliquer sur "Supprimer" sur la tâche "Tâche de test premium".
- [ ] Vérifier qu'une modale de **Cartographie d'Impact UI** s'affiche et liste les éléments liés (ex: sous-tâches, commentaires).
- [ ] Confirmer la suppression → Vérifier que la tâche disparaît des listes actives.
- [ ] Aller dans la section "Corbeille" → Vérifier que la tâche y figure.
- [ ] Cliquer sur "Restaurer" → Vérifier qu'elle retourne dans les tâches actives.
- [ ] Cliquer sur "Supprimer définitivement" → Vérifier sa suppression physique complète dans Supabase.

---

## ✅ FEATURE 4 : SOUS-TÂCHES & CHECKLISTS (F-04)
> **Objectif :** Valider la décomposition hiérarchique d'une tâche et le calcul de la progression réactive.

### 📝 Cas de test 4.1 : Cycle de vie des sous-tâches
- [ ] Ouvrir le détail d'une tâche (Slide-over).
- [ ] Cliquer sur "Ajouter une sous-tâche".
- [ ] Saisir 3 sous-tâches (ex: "Sous-tâche A", "Sous-tâche B", "Sous-tâche C").
- [ ] Vérifier que la barre de progression globale de la tâche affiche `0%` (0 sur 3 terminées).
- [ ] Cocher la case de la "Sous-tâche A" → Vérifier que la barre de progression passe instantanément à `33%` (1/3).
- [ ] Cocher la case de la "Sous-tâche B" → Vérifier que la barre passe à `67%` (2/3).
- [ ] Réordonner les sous-tâches par drag & drop (icône grip) → Vérifier que le nouvel ordre est conservé après fermeture et réouverture du détail.

---

## 👁️ FEATURE 5 : VUES MULTIPLES (F-05)
> **Objectif :** Tester la conformité graphique et fonctionnelle des différents modes d'affichage.

### 📝 Cas de test 5.1 : Navigation entre les vues
- [ ] Se rendre sur la page des Tâches.
- [ ] Cliquer sur les différents switchs de vue :
  - [ ] **Tableau** : Affiche les colonnes structurées et permet le tri en cliquant sur les en-têtes (Titre, Priorité, Échéance).
  - [ ] **Grille** : Affiche des cartes élégantes et responsives sur 3-4 colonnes.
  - [ ] **Kanban** : Trie les tâches dans 4 colonnes de statut (`À faire`, `En cours`, `Terminé`, `Reporté`).
  - [ ] **Calendrier** : Intègre FullCalendar avec les tâches positionnées aux bonnes dates de deadline.
- [ ] Dans la vue **Kanban**, glisser-déposer une tâche d'une colonne à une autre → Vérifier que le statut de la tâche est immédiatement mis à jour en base de données.
- [ ] Recharger la page → Vérifier que la dernière vue sélectionnée est restaurée (persistance via localStorage).

---

## ⏱️ FEATURE 7 : TIMER & CHRONOMÈTRE (F-07)
> **Objectif :** Assurer le suivi et la comptabilisation exacte du temps de focus sur une tâche.

### 📝 Cas de test 7.1 : Focus Pomodoro & Chrono
- [ ] Ouvrir le widget de Timer (en bas à droite).
- [ ] Sélectionner une tâche active dans la liste déroulante.
- [ ] Lancer le Chronomètre → Vérifier que le décompte s'incrémente de seconde en seconde.
- [ ] Naviguer sur le Dashboard, puis sur les Projets → Vérifier que le chrono continue de tourner en arrière-plan sans s'interrompre.
- [ ] Mettre en pause, puis cliquer sur "Stop" → Vérifier qu'une modale propose d'enregistrer la session de travail.
- [ ] Enregistrer la session → Vérifier que le temps total passé sur la tâche dans son panneau de détail a augmenté de la durée correspondante.

---

## 🎮 FEATURE 8 & 9 : VALIDATION GAMIFIÉE & HUMEUR (F-08, F-09)
> **Objectif :** Valider la rigueur gamifiée lors de la complétion et le retour émotionnel.

### 📝 Cas de test 8.1 : Défi de calcul mental & Humeur
- [ ] Cliquer sur "Terminer" sur une tâche de priorité **Urgente**.
- [ ] Vérifier qu'une modal bloquante s'ouvre, contenant un calcul mental complexe (difficulté proportionnelle à la priorité).
- [ ] Entrer une réponse erronée 3 fois de suite → Vérifier que la tâche passe en statut "À reprendre" avec un badge d'avertissement.
- [ ] Cliquer à nouveau sur "Terminer" sur une autre tâche et entrer la bonne réponse → Vérifier la validation de la tâche.
- [ ] Constater l'ouverture immédiate de la modal d'appréciation emoji (humeur).
- [ ] Cliquer sur "🚀 Super productif" → Vérifier que l'appréciation est bien sauvegardée et s'affiche sur la carte de la tâche.

---

## 📁 FEATURE 10 : GESTION DE PROJETS (F-10)
> **Objectif :** Tester le regroupement de tâches par objectifs et la progression automatique globale.

### 📝 Cas de test 10.1 : Cycle de vie d'un Projet
- [ ] Aller sur `/projects` et cliquer sur "Nouveau Projet".
- [ ] Créer le projet "Développement UrsUle" avec une deadline et une couleur verte.
- [ ] Créer une nouvelle tâche en la liant à ce projet.
- [ ] Vérifier que la barre de progression du projet s'affiche à `0%`.
- [ ] Marquer la tâche comme "Terminée" (en réussissant le calcul) → Vérifier que la progression du projet passe automatiquement à `100%`.
- [ ] Cliquer sur Supprimer le projet → Vérifier qu'une modale de **Cartographie d'Impact UI** liste les tâches qui y sont rattachées avant de confirmer.

---

## 📊 FEATURE 11 : STATISTIQUES (F-11)
> **Objectif :** Valider la génération des graphiques de productivité interactifs via Chart.js.

### 📝 Cas de test 11.1 : Visualisation analytique
- [ ] Aller sur la page `/stats`.
- [ ] Vérifier la présence et le bon rendu des graphiques suivants :
  - [ ] Tâches complétées par jour (Line Chart).
  - [ ] Répartition par catégorie (Donut Chart).
  - [ ] Répartition des humeurs (Bar Chart).
  - [ ] Temps passé par projet (Donut Chart).
- [ ] Utiliser le filtre de date pour cibler uniquement "Aujourd'hui" → Vérifier que les graphiques se mettent à jour instantanément.

---

## 📤 FEATURE 12 & 13 : EXPORTS & MÉDIAS (F-12, F-13)
> **Objectif :** Tester la génération de documents (PDF/Excel) et l'hébergement de fichiers sur Supabase Storage.

### 📝 Cas de test 12.1 : Génération de rapports
- [ ] Se rendre sur la vue liste des Tâches.
- [ ] Cliquer sur le bouton d'exportation :
  - [ ] **PDF** : Télécharger le rapport. L'ouvrir et vérifier la mise en page propre, la présence du logo "UrsUle" et la liste exacte des tâches actives filtrées.
  - [ ] **Excel** : Télécharger le fichier `.xlsx`. L'ouvrir et valider que les colonnes sont correctement nommées en français et contiennent les bonnes données.

### 📝 Cas de test 13.1 : Pièces jointes (Upload Supabase)
- [ ] Ouvrir le détail d'une tâche active.
- [ ] Glisser-déposer une image de plus de 5MB → Vérifier que le système refuse l'upload.
- [ ] Uploader une image valide (ex: PNG de 1MB) → Vérifier que la miniature s'affiche dans la galerie après upload dans le bucket `task-images`.
- [ ] Cliquer sur l'image → Vérifier l'ouverture de la Lightbox plein écran.
- [ ] Cliquer sur l'icône de suppression sur l'image → Vérifier qu'elle disparaît de la galerie et est effacée du bucket Supabase.

---

## 🔗 FEATURE 15 : WEBHOOKS & LOGS (F-15)
> **Objectif :** Valider l'envoi de webhooks lors des événements clés pour intégration externe (Make/n8n).

### 📝 Cas de test 15.1 : Déclenchement de Webhooks
- [ ] Aller dans les Paramètres et définir une URL de webhook valide (ex: webhook de test de Make.com).
- [ ] Créer une nouvelle tâche dans l'application.
- [ ] Aller sur la page de logs de Webhooks → Vérifier qu'une ligne a été créée avec l'événement `task_created`, le payload JSON contenant les infos de la tâche, et le code de statut de réponse de l'API distante.

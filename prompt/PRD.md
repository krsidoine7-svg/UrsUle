# 📋 PRD — UrsUle : Gestionnaire d'Agenda & Tâches Intelligent
**Version:** 1.0.0  
**Date:** 2025  
**Auteur:** Krsidoine (krsidoine7@gmail.com)  
**Statut:** Draft → Validation

---

## 1. VISION PRODUIT

### 1.1 Résumé Exécutif
UrsUle est une application web progressive de gestion d'agenda et de tâches, conçue pour les jeunes entrepreneurs et leurs équipes en Côte d'Ivoire et en Afrique francophone. Elle combine la rigueur d'un outil professionnel avec la simplicité d'une application pensée "pour un enfant" — intuitive, visuellement forte, et engageante.

### 1.2 Problème Résolu
Les outils actuels (Notion, Trello, Asana) sont :
- Trop complexes pour un entrepreneur débutant
- Mal adaptés au contexte africain (langue, timezone, flux de travail)
- Sans mécanisme de validation réelle des tâches accomplies
- Sans suivi émotionnel/motivationnel de la productivité

### 1.3 Proposition de Valeur
> "UrsUle te permet de planifier, exécuter et valider tes tâches avec une rigueur gamifiée — tu ne coches une tâche comme faite que si tu le prouves vraiment."

### 1.4 Utilisateurs Cibles
| Persona | Description |
|---|---|
| Krsidoine (Primaire) | Jeune entrepreneur, 20-30 ans, Abidjan, débutant no-code, vidéo-coding |
| Partenaires (Secondaire) | Collaborateurs directs, même contexte, usage partagé |

---

## 2. OBJECTIFS & KPIs

### 2.1 Objectifs MVP (3 mois)
- Authentification fonctionnelle
- CRUD complet des tâches et projets
- 3 vues d'affichage (Tableau, Calendrier, Kanban)
- Export PDF/Excel
- Validation par quiz/calcul
- Statistiques de base

### 2.2 KPIs de Succès
| Indicateur | Cible MVP | Cible V2 |
|---|---|---|
| Tâches créées/semaine | 10+ par user | 50+ |
| Taux de complétion validée | >60% | >75% |
| Satisfaction (NPS interne) | >7/10 | >8/10 |
| Temps moyen session | >8 min | >15 min |

---

## 3. FONCTIONNALITÉS DÉTAILLÉES

### F-01 : AUTHENTIFICATION & PROFIL
**Priorité:** P0 (Critique)  
**Description:** Système de connexion sécurisé avec gestion de profil utilisateur.

**Exigences fonctionnelles :**
- Inscription par email/mot de passe
- Connexion sécurisée (JWT + Supabase Auth)
- Récupération de mot de passe par email
- Profil utilisateur : nom, photo, timezone (Africa/Abidjan), préférences
- Gestion multi-utilisateurs (Krsidoine + partenaires)
- Déconnexion et protection des routes

**Critères d'acceptation :**
- [ ] L'utilisateur peut créer un compte avec krsidoine7@gmail.com
- [ ] Le token expire après 24h (refresh automatique)
- [ ] Les routes /dashboard sont protégées sans connexion
- [ ] La page de connexion affiche le logo UrsUle

---

### F-02 : DASHBOARD PRINCIPAL
**Priorité:** P0  
**Description:** Tableau de bord central affichant l'état du jour, les tâches urgentes, et les métriques clés.

**Exigences fonctionnelles :**
- Vue d'ensemble : tâches du jour, en retard, à venir
- Widget météo/motivation (citation du jour)
- Raccourcis rapides : créer tâche, créer projet
- Indicateurs : tâches complétées ce mois, taux de réussite, streak
- Notifications non lues
- Heure locale Africa/Abidjan

**Critères d'acceptation :**
- [ ] Dashboard chargé en < 2 secondes
- [ ] Les tâches urgentes sont affichées en rouge
- [ ] Le nombre de tâches du jour est correct

---

### F-03 : GESTION DES TÂCHES (CRUD)
**Priorité:** P0  
**Description:** Création, lecture, modification, suppression complète des tâches.

**Champs d'une tâche :**
```
- titre (texte riche, obligatoire)
- description (Markdown + texte riche : H1/H2, listes, gras, italique)
- statut : À faire | En cours | Terminé | Archivé | Reporté
- priorité : Faible | Normale | Haute | Urgente
- catégorie (statiques + personnalisables)
- durée estimée (en minutes OU heures)
- durée réelle (chronomètre intégré)
- date de début
- deadline (date + heure)
- date de validité (expiration automatique)
- récurrence : Jamais | Quotidienne | Hebdo | Mensuelle | Personnalisée
- objectif lié (référence à un projet)
- sous-tâches (liste de checklist interne)
- commentaires (texte, avec timestamp)
- images jointes (upload Supabase Storage)
- appréciation finale (post-completion mood)
- tags libres
- épinglé (pin to top)
- couleur personnalisée
- webhook URL (optionnel)
```

**Exigences fonctionnelles :**
- Formulaire de création en slide-over panel (pas de page séparée)
- Édition inline pour titre et statut
- Suppression avec confirmation (soft delete → corbeille)
- **Boîte de dialogue de Cartographie d'Impact de Suppression (UI)** : Lors d'un clic sur supprimer, afficher une modale calculant et listant précisément l'impact de l'action (ex: *"Cette tâche contient 3 sous-tâches et 2 images jointes. Sa suppression logique masquera également ces sous-tâches. Confirmer la mise à la corbeille ?"*).
- Sauvegarde automatique en brouillon toutes les 30s
- Duplication d'une tâche
- Glisser-déposer pour réordonner

**Critères d'acceptation :**
- [ ] Création d'une tâche en < 5 clics
- [ ] Le Markdown est rendu en temps réel dans la description
- [ ] Les images uploadées sont visibles dans la tâche
- [ ] La suppression passe par une corbeille récupérable 30 jours (Soft Delete database)
- [ ] La boîte de dialogue de Cartographie d'Impact affiche correctement le décompte des dépendances logiques avant validation de la suppression.

---

### F-04 : SOUS-TÂCHES & CHECKLISTS
**Priorité:** P1  
**Description:** Découpage hiérarchique des tâches complexes.

**Exigences fonctionnelles :**
- Ajout de N sous-tâches à une tâche parent
- Chaque sous-tâche a : titre, statut (checkbox), deadline, assigné
- Progression automatique de la tâche parent (ex: 3/5 sous-tâches = 60%)
- Checklist simple (sans deadline) pour les listes rapides
- Réordonner les sous-tâches par drag & drop

**Critères d'acceptation :**
- [ ] La barre de progression parent se met à jour en temps réel
- [ ] Les sous-tâches sont visibles dans toutes les vues

---

### F-05 : VUES D'AFFICHAGE
**Priorité:** P1  
**Description:** Plusieurs modes de visualisation des tâches.

**Vues disponibles :**

| Vue | Description |
|---|---|
| **Tableau** | Liste classique avec colonnes triables |
| **Grille** | Cards en grille 3-4 colonnes |
| **Calendrier** | Vue mensuelle/hebdo/jour (FullCalendar) |
| **Kanban** | Colonnes par statut, drag & drop |
| **Épinglées** | Vue dédiée aux tâches pinnées |

**Exigences fonctionnelles :**
- Persistance de la vue préférée par utilisateur
- Filtrage dans toutes les vues (par catégorie, priorité, date, statut)
- Tri multicritère (priorité + deadline + création)
- Recherche textuelle instantanée (debounce 300ms)

**Critères d'acceptation :**
- [ ] Le changement de vue est instantané (< 200ms)
- [ ] Les filtres se combinent (ET logique)
- [ ] La vue Kanban supporte le DnD entre colonnes

---

### F-06 : CATÉGORIES
**Priorité:** P1  
**Description:** Organisation des tâches par catégories.

**Catégories statiques (non supprimables) :**
- Personnel, Travail, Apprentissage, Finance, Santé, Projets

**Catégories personnalisées :**
- Nom, couleur (palette 20 couleurs), icône (Lucide)
- CRUD complet
- Ordre personnalisable

**Critères d'acceptation :**
- [ ] Max 20 catégories personnalisées par user
- [ ] La suppression d'une catégorie déplace les tâches vers "Sans catégorie"

---

### F-07 : TIMER & CHRONOMÈTRE
**Priorité:** P1  
**Description:** Mesure du temps passé sur chaque tâche.

**Exigences fonctionnelles :**
- Timer décompte (Pomodoro-like) : définir une durée, décompte visible
- Chronomètre : démarrer/pause/stop, enregistre le temps réel
- Notification browser quand le timer se termine
- Historique des sessions de travail par tâche
- Intégration avec la durée réelle de la tâche

**Critères d'acceptation :**
- [ ] Le timer continue si on change de vue (background)
- [ ] La notification fonctionne même onglet minimisé
- [ ] Le temps total est affiché dans les stats

---

### F-08 : VALIDATION GAMIFIÉE
**Priorité:** P1 (Différenciateur clé)  
**Description:** Pour marquer une tâche comme "Terminée", l'utilisateur doit réussir un mini-défi.

**Types de défis :**
1. **Calcul mental** : ex "Combien fait 7 × 8 ?" (généré aléatoirement, difficulté selon priorité)
2. **Question ouverte** : ex "Décris en 1 phrase ce que tu as accompli" (validation manuelle ou IA)
3. **Quiz sur l'objectif** : question liée à l'objectif de la tâche (définie à la création)

**Règles :**
- 3 tentatives maximum
- En cas d'échec : tâche passe en statut "À reprendre" avec notification
- Score de réussite sauvegardé dans les stats
- Possibilité de désactiver la validation (mode admin/confiance)

**Critères d'acceptation :**
- [ ] Le défi apparaît dans une modal bloquante
- [ ] Le calcul est correct et a une réponse valide
- [ ] L'échec reporte la tâche avec un badge visible

---

### F-09 : APPRÉCIATION POST-TÂCHE
**Priorité:** P2  
**Description:** Après validation, l'utilisateur note son ressenti.

**Options d'appréciation :**
- 😊 Content / Satisfait
- 😤 Trop difficile
- 😴 Ennuyeux
- 🤔 Rien appris
- 🚀 Super productif
- 😰 Stressant
- 💡 Très enrichissant
- 😐 Neutre

**Exigences fonctionnelles :**
- Modal rapide (2 secondes max, pas bloquant)
- Skippable (mais comptabilisé comme "Neutre")
- Affiché dans les statistiques (répartition des humeurs)

---

### F-10 : GESTION DE PROJETS
**Priorité:** P1  
**Description:** Regroupement de tâches en projets avec suivi global.

**Champs d'un projet :**
```
- nom, description, couleur, icône
- statut : Actif | En pause | Terminé | Archivé
- deadline global
- budget (optionnel, FCFA)
- membres associés (partenaires)
- tâches liées
- progression globale (% auto-calculé)
- notes de projet (Markdown)
```

**Vues projet :**
- Vue liste des tâches du projet
- Vue Kanban du projet
- Timeline (Gantt simplifié)
- **Boîte de dialogue de Cartographie d'Impact de Suppression (UI)** : Lors d'un clic sur supprimer un projet, afficher une modale calculant l'impact sur le flux de travail (ex: *"Ce projet contient 5 tâches actives et 3 membres collaborateurs associés. Sa suppression logique masquera ces tâches et rompra les liens de projet. Confirmer la suppression logique ?"*).

**Critères d'acceptation :**
- [ ] Un projet affiche sa progression en temps réel
- [ ] Les membres peuvent voir les tâches du projet
- [ ] La timeline est lisible sur mobile
- [ ] La boîte de dialogue de Cartographie d'Impact UI affiche le décompte chiffré des tâches et des membres affectés avant de valider la suppression logique du projet (Soft Delete).

---

### F-11 : STATISTIQUES & GRAPHIQUES
**Priorité:** P1  
**Description:** Tableaux de bord analytiques de productivité.

**Graphiques disponibles :**
- Tâches complétées par : Jour / Semaine / Mois
- Taux de complétion (% tâches validées vs créées)
- Répartition par catégorie (donut chart)
- Humeur/appréciation sur la période (bar chart)
- Temps passé par tâche/projet (donut)
- Streak de productivité (calendar heatmap)
- Tâches en retard (courbe)

**Filtres stats :**
- Période personnalisée (date picker range)
- Par catégorie
- Par projet

**Critères d'acceptation :**
- [ ] Les graphiques chargent en < 1s
- [ ] L'export des stats en PNG est disponible
- [ ] La vue "date spécifique" affiche exactement ce jour-là

---

### F-12 : EXPORT
**Priorité:** P2  
**Description:** Export des données dans différents formats.

**Formats :**
- **PDF** : Rapport de tâches formaté (logo UrsUle, date, filtres appliqués)
- **Excel (.xlsx)** : Tableau brut avec toutes les colonnes
- **JSON** : Export brut pour backup ou intégration
- **Markdown** : Pour copier dans Notion ou autres outils

**Critères d'acceptation :**
- [ ] Le PDF généré est lisible et bien formaté
- [ ] L'Excel contient des colonnes lisibles en français
- [ ] L'export respecte les filtres actifs

---

### F-13 : IMAGES & MÉDIAS
**Priorité:** P2  
**Description:** Pièces jointes visuelles aux tâches.

**Exigences fonctionnelles :**
- Upload drag & drop d'images (JPG, PNG, WebP)
- Max 5 images par tâche, max 5MB par image
- Galerie miniature dans la tâche
- Lightbox pour agrandissement
- Stockage Supabase Storage

---

### F-14 : SYNCHRONISATION GOOGLE DRIVE
**Priorité:** P2  
**Description:** Backup automatique vers Google Drive.

**Exigences fonctionnelles :**
- Connexion OAuth Google
- Sync automatique quotidien (export JSON vers Drive)
- Sync manuel déclenchable
- Confirmation de la dernière sync

---

### F-15 : WEBHOOKS & AUTOMATISATION
**Priorité:** P3  
**Description:** Intégration avec des outils no-code.

**Exigences fonctionnelles :**
- URL webhook configurable par projet ou globalement
- Événements déclencheurs : tâche créée, complétée, en retard, reportée
- Payload JSON configurable
- Log des appels webhook (succès/échec)
- Compatible Make, Zapier, n8n

---

### F-16 : FORMATAGE DE TEXTE RICHE
**Priorité:** P1  
**Description:** Éditeur WYSIWYG/Markdown pour descriptions et commentaires.

**Fonctionnalités de l'éditeur :**
- Titres H1, H2, H3
- Texte **gras**, *italique*, ~~barré~~
- Listes à puces et numérotées
- `Code inline` et blocs de code
- Liens hypertexte
- Tableaux simples
- Toggle Markdown brut / Rendu visuel
- Export du contenu en JSON (Tiptap format) ou Markdown

---

### F-17 : RÉCURRENCE
**Priorité:** P2  
**Description:** Tâches répétitives automatiques.

**Options :**
- Quotidienne (avec jours sélectionnables)
- Hebdomadaire (jours de la semaine)
- Mensuelle (date du mois)
- Personnalisée (tous les N jours)
- Fin de récurrence : après N occurrences ou date limite

---

### F-18 : NOTIFICATIONS & RAPPELS
**Priorité:** P2  
**Description:** Alertes proactives pour les deadlines.

**Types :**
- Notification navigateur (Push API)
- Rappel configurable : 1h avant, 1 jour avant, 1 semaine avant
- Alerte tâche en retard
- Digest quotidien (récap des tâches du jour)

---

## 4. CONTRAINTES & LIMITES MVP

### Hors scope MVP V1
- Application mobile native
- Mode hors ligne complet
- IA générative intégrée
- Facturation/abonnement
- Multi-langue (UI en français uniquement)
- API publique documentée

### Limites techniques MVP
- Max 500 tâches par utilisateur
- Max 20 projets actifs
- Max 5 images par tâche
- Max 10 membres par compte

---

## 5. EXIGENCES NON FONCTIONNELLES

| Exigence | Cible |
|---|---|
| Performance | LCP < 2.5s, FID < 100ms |
| Disponibilité | 99.5% (Vercel + Supabase SLA) |
| Sécurité | OWASP Top 10, AES-256 données sensibles |
| Accessibilité | WCAG 2.1 AA partiel |
| Timezone | Africa/Abidjan (GMT+0) par défaut |
| Langue | Français uniquement (MVP) |
| Navigateurs | Chrome 90+, Firefox 90+, Safari 14+ |

---

## 6. FLUX UTILISATEUR PRINCIPAL

```
1. Arrivée → Page de connexion (UrsUle branding)
2. Connexion → Dashboard (vue du jour)
3. + Nouvelle tâche → Slide-over panel
4. Remplir : titre, deadline, priorité, catégorie
5. Sauvegarder → Tâche visible dans la vue active
6. Démarrer chrono → Travailler
7. Marquer "Terminée" → Défi de validation
8. Réussir le défi → Appréciation post-tâche
9. Stats → Voir progression du jour/semaine
```

---

## 7. GLOSSAIRE

| Terme | Définition |
|---|---|
| Tâche | Unité de travail à accomplir |
| Projet | Regroupement de tâches avec un objectif commun |
| Validation gamifiée | Quiz/calcul pour confirmer la complétion |
| Appréciation | Humeur/ressenti post-tâche |
| Streak | Nombre de jours consécutifs de productivité |
| Deadline | Date limite d'une tâche |
| Récurrence | Répétition automatique d'une tâche |

---
*Document vivant — mis à jour après chaque sprint*

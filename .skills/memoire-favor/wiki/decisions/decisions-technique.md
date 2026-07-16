<!-- Dernière mise à jour : Mai 2026 -->

# Décisions Techniques — Favor Company International

**Liens :** [INDEX.md](../INDEX.md) | [projet/architecture.md](../projet/architecture.md)

> Format : `[Date] Décision | Contexte | Raison | Alternative rejetée`

---

## [Mai 2026] Utiliser Next.js 15 App Router

**Contexte :** Choix du framework principal  
**Décision :** Next.js 15 avec App Router uniquement (pas de pages/)  
**Raison :** Server Actions natifs, SSR/SSG intégré, meilleur DX TypeScript, Vercel natif  
**Alternative rejetée :** Remix — moins mature dans l'écosystème Vercel/Supabase  
**Lien :** [stack/nextjs.md](../stack/nextjs.md)

---

## [Mai 2026] Utiliser Drizzle ORM

**Contexte :** Choix de l'ORM pour PostgreSQL/Supabase  
**Décision :** Drizzle ORM  
**Raison :** Plus léger que Prisma, 100% type-safe, migrations simples, compatible Supabase  
**Alternative rejetée :** Prisma — overhead trop important, génération de types moins précise  
**Lien :** [stack/drizzle.md](../stack/drizzle.md)

---

## [Mai 2026] Utiliser Paystack pour les paiements

**Contexte :** Choix du prestataire de paiement en Côte d'Ivoire  
**Décision :** Paystack  
**Raison :** Meilleure couverture Mobile Money CI (Orange Money, MTN MoMo, Wave), API stable, documentation claire  
**Alternative rejetée :** Stripe — pas disponible en CI, pas de Mobile Money local  
**Lien :** [stack/paystack.md](../stack/paystack.md)

---

## [Mai 2026] Utiliser Cloudflare R2 pour le stockage

**Contexte :** Stockage des images, vidéos, contrats PDF  
**Décision :** Cloudflare R2  
**Raison :** Pas de frais d'egress (vs AWS S3), compatible API S3, prix compétitif  
**Alternative rejetée :** AWS S3 — frais d'egress importants, Supabase Storage — limites de taille  
**Lien :** [stack/cloudflare-r2.md](../stack/cloudflare-r2.md)

---

## [Mai 2026] Server Actions uniquement pour les mutations

**Contexte :** Sécurité des mutations côté serveur  
**Décision :** Toutes les mutations passent par des Server Actions (`'use server'`)  
**Raison :** Sécurité (pas d'exposition des secrets), validation côté serveur garantie, meilleure DX  
**Alternative rejetée :** API Routes pour les mutations — plus verbeux, même sécurité mais plus de code  
**Lien :** [bonnes-pratiques/patterns-backend.md](../bonnes-pratiques/patterns-backend.md)

---

## [Mai 2026] AES-256-GCM pour les données sensibles

**Contexte :** Chiffrement des données personnelles en base  
**Décision :** AES-256-GCM avec ENCRYPTION_KEY de 32 bytes  
**Données chiffrées :** Téléphones, CNI, données financières  
**Raison :** Standard recommandé NIST, authentifié (détecte les modifications), rapide  
**Alternative rejetée :** AES-256-CBC — pas d'authentification intégrée  
**Lien :** [bonnes-pratiques/patterns-securite.md](../bonnes-pratiques/patterns-securite.md)

---

## [Mai 2026] Transaction atomique pour les réservations

**Contexte :** Éviter la double réservation simultanée  
**Décision :** Fonction RPC PostgreSQL avec `FOR UPDATE NOWAIT`  
**Raison :** Verrou au niveau DB = seule garantie fiable contre la concurrence  
**Alternative rejetée :** Vérification applicative (SELECT + UPDATE séparés) — race condition possible  
**Lien :** [bonnes-pratiques/patterns-db.md](../bonnes-pratiques/patterns-db.md)

---

## [14 Juin 2026] Centraliser la personnalisation dynamique via un store Pinia (appConfig)

**Contexte :** Permettre à l'administrateur de personnaliser l'image de marque (nom de l'app, citation, auteur, liens) dynamiquement sans recompiler le code.  
**Décision :** Création d'une table Supabase `app_settings` à ligne unique et d'un store Pinia `appConfig` pour charger et mettre en cache la configuration côté client.  
**Raison :** Évite de requêter la base de données sur chaque page (ex: Login, Register et Dashboard) tout en rendant les changements immédiats et transparents.  
**Alternative rejetée :** Variables d'environnement standard (.env) — nécessitent une recompilation et un redéploiement à chaque changement.

---

## [14 Juin 2026] Définir le build target sur ES2022 dans Vite

**Contexte :** Blocage du build suite à une erreur ESBuild sur `date-fns` v4 (`Transforming destructuring to the configured target environment is not supported yet`).  
**Décision :** Configurer `target: 'es2022'` et `supported: { 'destructuring': true }` dans `vite.config.ts`.  
**Raison :** Tous les navigateurs modernes supportent nativement la destructuration depuis plusieurs années. Cela évite à esbuild de devoir traduire cette syntaxe moderne, supprimant ainsi l'erreur de compilation tout en optimisant le code produit.  
**Alternative rejetée :** Utiliser `@vitejs/plugin-legacy` avec Babel — surcharge trop lourde en terme de bundle et inutile pour le public cible d'UrsUle.

---

## [16 Juillet 2026] Durcir l'accès aux fonctions SECURITY DEFINER et corriger l'inscription (GoTrue)

**Contexte :** Blocage de l'inscription utilisateur (`Database error saving new user`) suite au durcissement de sécurité RLS et alertes de sécurité du linter Supabase concernant les fonctions RPC et le search_path.  
**Décision :** Restreindre l'exécution de toutes les fonctions trigger et cron critiques à `service_role` et `postgres` en révoquant `PUBLIC`. Pour les fonctions liées aux triggers d'auth (`handle_new_user` et `set_admin_on_signup`), accorder explicitement les droits `EXECUTE` au rôle système **`supabase_auth_admin`**. Ajouter la clause `TO authenticated` sur l'intégralité des politiques RLS des tables utilisateur.  
**Raison :** Bloquer les appels directs non authentifiés de fonctions critiques via RPC sans impacter le comportement interne de PostgreSQL. L'accès de GoTrue (Supabase Auth) nécessite explicitement que son rôle système associé (`supabase_auth_admin`) soit autorisé à exécuter le trigger de création de profil.  
**Alternative rejetée :** Laisser les fonctions exécutables par `PUBLIC` — cela exposerait des fonctions privilégiées (comme le soft delete global ou la récurrence) à n'importe quel utilisateur connecté (voire non connecté) via l'API REST.

---

*Ajouter chaque nouvelle décision technique importante ici.*  
*Format : `## [Date] Titre | Contexte | Décision | Raison | Alternative | Lien`*


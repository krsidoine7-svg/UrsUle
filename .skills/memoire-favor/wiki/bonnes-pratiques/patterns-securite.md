<!-- Dernière mise à jour : 2026-06-14 -->
# Patterns de Sécurité Validés

## Pattern : Sécurisation Edge Function (Prévention SSRF)
**Validé le :** 2026-06-14
**Contexte :** `webhook-dispatcher` utilisé pour envoyer des données à Make.com
**Pattern :** Ne jamais fetch() aveuglément. Toujours extraire le token d'authentification de la requête, créer un client Supabase éphémère, et appeler `supabase.auth.getUser()`. Bloquer la requête si l'utilisateur est invalide.

## Pattern : Nettoyage XSS Stored (Tiptap / Vue)
**Validé le :** 2026-06-14
**Contexte :** Sauvegarde du contenu HTML généré par l'éditeur riche Tiptap (`NoteEditor.vue`).
**Pattern :** Même si Vue.js échappe l'affichage de base, il faut impérativement traiter la donnée avant insertion en base de données. Envelopper `editor.getHTML()` avec `DOMPurify.sanitize()` via un utilitaire centralisé (`sanitize.ts`).

## Pattern : Sécurisation Functions PostgreSQL (Search Path Injection)
**Validé le :** 2026-06-14
**Contexte :** Fonctions tournant avec les privilèges de l'appelant originel (`SECURITY DEFINER`).
**Pattern :** Ajouter `SET search_path = public` systématiquement lors de la déclaration de la fonction pour empêcher l'exécution de code malveillant via redéfinition du chemin de recherche des schémas.

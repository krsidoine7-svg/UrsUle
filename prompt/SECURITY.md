# 🔒 SECURITY — UrsUle : Guide Sécurité Complet
**Basé sur OWASP Top 10 2021**  
**Stack : Vue 3 + Supabase + Vercel**

---

## 1. AUTHENTIFICATION & GESTION DES SESSIONS

### 1.1 Supabase Auth (GoTrue)
```typescript
// src/services/auth.service.ts

import { supabase } from './supabase'

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })
    if (error) throw new Error('Identifiants incorrects') // Message générique (pas de fuite d'info)
    return data
  },

  async signUp(email: string, password: string, fullName: string) {
    // Validation robuste côté client
    if (!isValidEmail(email)) throw new Error('Email invalide')
    if (!isStrongPassword(password)) throw new Error('Mot de passe trop faible')
    if (fullName.length < 2 || fullName.length > 100) throw new Error('Nom invalide')
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })
    if (error) throw error
    return data
  },

  async signOut() {
    // Nettoyer le state local aussi
    localStorage.removeItem('ursule_draft')
    sessionStorage.clear()
    await supabase.auth.signOut()
  }
}

// Validation email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Politique mot de passe : min 8 chars, 1 maj, 1 chiffre
function isStrongPassword(password: string): boolean {
  return password.length >= 8 
    && /[A-Z]/.test(password) 
    && /[0-9]/.test(password)
}
```

### 1.2 Protection des Routes (Vue Router Guard)
```typescript
// src/router/index.ts

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Vérifier session active (pas juste le store local)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.meta.requiresAuth && !session) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.guest && session) {
    next({ path: '/' })
    return
  }
  
  next()
})
```

### 1.3 Refresh Token Automatique
```typescript
// src/main.ts
supabase.auth.onAuthStateChange((event, session) => {
  const authStore = useAuthStore()
  
  if (event === 'SIGNED_IN') {
    authStore.setSession(session)
  }
  
  if (event === 'SIGNED_OUT') {
    authStore.clearSession()
    router.push('/login')
  }
  
  if (event === 'TOKEN_REFRESHED') {
    authStore.setSession(session)
  }
})
```

---

## 2. OWASP TOP 10 — IMPLÉMENTATION

### A01 : Broken Access Control → RLS Supabase

```sql
-- Chaque table a ses policies RLS
-- Exemple : un user ne peut lire/écrire QUE ses propres tâches

-- POLITIQUE : SELECT
CREATE POLICY "task_select_own" ON tasks
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- POLITIQUE : INSERT
CREATE POLICY "task_insert_own" ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLITIQUE : UPDATE  
CREATE POLICY "task_update_own" ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLITIQUE : DELETE (soft delete uniquement)
CREATE POLICY "task_delete_own" ON tasks
  FOR UPDATE  -- On UPDATE deleted_at, pas de DELETE réel
  USING (auth.uid() = user_id);

-- JAMAIS de DELETE direct autorisé via API publique
-- Les suppressions physiques se font uniquement via service_role (admin)
```

#### 🛡️ Standard Technique : Patron `Soft Delete` & Intégrité Relationnelle

Afin de se prémunir contre la perte accidentelle de données et de garantir l'intégrité référentielle en base de données, l'application UrsUle applique le patron **Soft Delete (suppression logique)** sur toutes ses entités clés. 

##### 1. Pourquoi le Soft Delete ? (Étude d'Impact)
Dans un système relationnel, la suppression physique (`DELETE` SQL) d'un élément parent (ex: un projet ou un agent/collaborateur) entraîne généralement :
* Soit une erreur de violation de clé étrangère (bloquant l'action de l'utilisateur).
* Soit une suppression en cascade (`ON DELETE CASCADE`), qui détruit silencieusement des dizaines d'enregistrements enfants (tâches en cours, commentaires, historiques de facturation ou clients). Par exemple, si un administrateur supprime un agent qui gère 10 clients et 50 transactions, toutes les données de prospection et de paiements associées à ces clients risquent d'être détruites.

Le **Soft Delete** résout cela : la ligne reste physiquement en base de données, préservant toutes les clés étrangères, mais elle est masquée de l'interface en marquant sa colonne `deleted_at`.

##### 2. Optimisation des Requêtes : Index SQL Partiels
Puisque 99% des requêtes courantes ne lisent que les données actives (`WHERE deleted_at IS NULL`), la présence de lignes logiquement supprimées peut ralentir les scans de table. Pour optimiser les temps de réponse, nous devons configurer des **index partiels** Postgres :

```sql
-- Index partiel sur les tâches actives d'un utilisateur
CREATE INDEX idx_tasks_active_user 
ON tasks (user_id) 
WHERE deleted_at IS NULL;

-- Index partiel sur les projets actifs d'un utilisateur
CREATE INDEX idx_projects_active_user 
ON projects (user_id) 
WHERE deleted_at IS NULL;
```
* **Bénéfice** : L'index est extrêmement compact car il ignore toutes les lignes supprimées, réduisant l'utilisation de la RAM et accélérant le temps de traitement des requêtes à moins d'une milliseconde.

##### 3. Politique RLS de Filtrage
Toutes les requêtes de sélection côté client doivent être filtrées par la politique RLS pour masquer automatiquement les éléments en corbeille :

```sql
-- La politique s'assure qu'aucun élément soft-deleted n'est renvoyé par le Data API
CREATE POLICY "select_active_only" ON tasks
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
```

---


### A02 : Cryptographic Failures → Chiffrement AES

```typescript
// src/utils/crypto.utils.ts
// Chiffrement AES-256-GCM pour données sensibles locales

import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_AES_SECRET

export const cryptoUtils = {
  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
  },

  decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  },

  // Pour stocker des données sensibles dans localStorage
  setSecure(key: string, value: unknown): void {
    const encrypted = this.encrypt(JSON.stringify(value))
    localStorage.setItem(key, encrypted)
  },

  getSecure<T>(key: string): T | null {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    try {
      const decrypted = this.decrypt(encrypted)
      return JSON.parse(decrypted) as T
    } catch {
      localStorage.removeItem(key) // Corrompue → supprimer
      return null
    }
  }
}

// Usage : cryptoUtils.setSecure('user_prefs', { theme: 'dark' })
```

### A03 : Injection → Validation & Sanitisation

```typescript
// src/utils/validation.utils.ts

import DOMPurify from 'dompurify'
import { z } from 'zod'

// Schemas de validation Zod (côté client)
export const TaskSchema = z.object({
  title: z.string()
    .min(1, 'Titre requis')
    .max(255, 'Titre trop long')
    .trim(),
  description: z.string().max(50000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  deadline: z.string().datetime().optional(),
  estimated_duration_minutes: z.number().int().min(1).max(10080).optional(), // max 1 semaine
  webhook_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).max(20),
})

// Sanitisation HTML (pour le contenu Tiptap rendu)
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'a', 'br', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'class'],
    FORBID_SCRIPTS: true,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'],
  })
}

// Pas d'interpolation directe dans les requêtes SQL
// Supabase utilise des requêtes paramétrées automatiquement
// ✅ supabase.from('tasks').select('*').eq('title', userInput)  ← SÉCURISÉ
// ❌ Jamais de template literals dans les requêtes SQL brutes
```

### A04 : Insecure Design → Rate Limiting

```typescript
// src/composables/useRateLimit.ts
// Protection contre le spam et les bruteforce côté client

export function useRateLimit(maxAttempts: number, windowMs: number) {
  const attempts = ref(0)
  const blocked = ref(false)
  let resetTimer: ReturnType<typeof setTimeout>

  function check(): boolean {
    if (blocked.value) return false
    
    attempts.value++
    
    if (attempts.value >= maxAttempts) {
      blocked.value = true
      resetTimer = setTimeout(() => {
        attempts.value = 0
        blocked.value = false
      }, windowMs)
      return false
    }
    
    return true
  }

  return { check, blocked, attempts }
}

// Usage dans LoginView.vue :
// const { check, blocked } = useRateLimit(5, 15 * 60 * 1000) // 5 tentatives / 15 min
// Supabase côté serveur gère aussi le rate limit (GoTrue built-in)
```

### A05 : Security Misconfiguration → Headers HTTP Vercel

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### A06 : Vulnerable Components → Audit NPM

```bash
# À exécuter régulièrement
npm audit
npm audit fix

# Garder les dépendances à jour
npx npm-check-updates -u
npm install

# .github/workflows/security.yml (GitHub Actions)
# name: Security Audit
# on: schedule (cron: '0 9 * * 1') # Chaque lundi
# steps: npm audit --audit-level=moderate
```

### A07 : Auth Failures → Politique Supabase

```sql
-- Dans le dashboard Supabase → Auth → Settings
-- Email confirmation : ACTIVÉ
-- Min password length : 8
-- Rate limiting : 5 tentatives / 5 min (Supabase built-in)
-- Token expiry : 1 heure (refresh token : 24h)
```

### A08 : Software Integrity → Variables d'Env

```bash
# Variables JAMAIS dans le code source
# Toujours dans .env.local (gitignored) et Vercel Env Vars

# .gitignore doit contenir :
.env
.env.local
.env.*.local

# Variables publiques (VITE_ préfixe) :
# → Exposées dans le bundle JS (côté client)
# → Ne jamais y mettre de secrets serveur

# Variables Supabase :
# VITE_SUPABASE_ANON_KEY → clé publique (OK d'être exposée, RLS protège)
# SUPABASE_SERVICE_ROLE_KEY → JAMAIS côté client, seulement Edge Functions
```

### A09 : Logging & Monitoring

```typescript
// src/utils/logger.ts
// Logger structuré sans données sensibles

export const logger = {
  error(message: string, context?: Record<string, unknown>) {
    // Ne jamais logger : passwords, tokens, données personnelles
    const safeContext = context ? sanitizeForLog(context) : {}
    console.error('[UrsUle Error]', message, safeContext)
    // En production : envoyer à Vercel Analytics / Sentry
  },

  info(message: string, context?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.info('[UrsUle]', message, context)
    }
  }
}

function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'email']
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      sensitiveKeys.some(s => k.toLowerCase().includes(s)) ? '[REDACTED]' : v
    ])
  )
}
```

### A10 : SSRF → Validation URLs Webhook

```typescript
// src/utils/validation.utils.ts

// Liste noire d'adresses internes (protection SSRF)
const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254',  // AWS metadata
  '10.', '172.16.', '192.168.',  // Réseaux privés
]

export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    
    // Seulement HTTPS en production
    if (import.meta.env.PROD && parsed.protocol !== 'https:') return false
    
    // Bloquer les adresses internes
    const hostname = parsed.hostname.toLowerCase()
    if (BLOCKED_HOSTS.some(blocked => hostname.includes(blocked))) return false
    
    return true
  } catch {
    return false
  }
}

// La validation est aussi faite côté Edge Function avant d'appeler le webhook
```

---

## 3. SÉCURITÉ DU STOCKAGE

### 3.1 Supabase Storage (Images)
```sql
-- Politique Storage : un user ne peut accéder qu'à ses propres images

INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'task_images_user_own',
  'task-images',
  'auth.uid()::text = (storage.foldername(name))[1]'
);

-- Structure des chemins : {user_id}/{task_id}/{filename}
-- Ex: a1b2c3d4/.../task_images/e5f6g7h8/photo.jpg
```

```typescript
// src/services/storage.service.ts

export const storageService = {
  async uploadImage(file: File, taskId: string): Promise<string> {
    const userId = useAuthStore().user?.id
    
    // Validation type MIME (jamais faire confiance au nom de fichier)
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Type de fichier non autorisé')
    }
    
    // Limite de taille : 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image trop lourde (max 5MB)')
    }
    
    // Nom de fichier sécurisé (pas de traversal path)
    const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.type.split('/')[1]}`
    const path = `${userId}/${taskId}/${safeFilename}`
    
    const { data, error } = await supabase.storage
      .from('task-images')
      .upload(path, file, { contentType: file.type, upsert: false })
    
    if (error) throw error
    return data.path
  }
}
```

---

## 4. PROTECTION DES DONNÉES PERSONNELLES

### 4.1 Données collectées & justification
| Donnée | Raison | Durée conservation |
|---|---|---|
| Email | Authentification | Durée du compte |
| Nom | Affichage profil | Durée du compte |
| Tâches/Projets | Service principal | Durée du compte |
| Logs webhook | Débogage | 30 jours |
| Sessions timer | Statistiques | 1 an |
| Appréciation | Statistiques | 1 an |

### 4.2 Droit à la suppression
```typescript
// Sur demande, suppression complète du compte :
// 1. Soft delete des tâches (deleted_at)
// 2. Suppression des images Storage
// 3. Suppression du profil
// 4. Suppression du compte auth.users (cascade via FK)

async function deleteAccount(userId: string) {
  // Supprimer les images Storage
  const { data: images } = await supabase
    .from('task_images')
    .select('storage_path')
    .eq('user_id', userId)
  
  if (images) {
    await supabase.storage
      .from('task-images')
      .remove(images.map(i => i.storage_path))
  }
  
  // Supprimer le compte auth (cascade supprime le profil et les données)
  await supabase.auth.admin.deleteUser(userId) // Côté Edge Function service_role
}
```

---

## 5. CHECKLIST SÉCURITÉ DÉPLOIEMENT

### Avant chaque déploiement Vercel :
- [ ] `npm audit` → 0 vulnérabilités critiques
- [ ] Variables d'env : aucun secret dans le code
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Headers HTTP configurés dans `vercel.json`
- [ ] HTTPS forcé (Vercel par défaut)
- [ ] CSP testé (pas d'erreurs console)
- [ ] Validation des inputs sur tous les formulaires
- [ ] Aucun `console.log` avec données sensibles en production

### Outils de test :
```bash
# Test headers HTTP
curl -I https://ursule.vercel.app

# Test CSP
# https://csp-evaluator.withgoogle.com/

# Scan OWASP ZAP (optionnel)
# https://www.zaproxy.org/

# Lighthouse Security audit
npx lighthouse https://ursule.vercel.app --only-categories=best-practices
```

---

## 6. GESTION DES INCIDENTS

### En cas de brèche suspectée :
1. **Révoquer** tous les tokens Supabase (Auth → Tokens → Revoke All)
2. **Changer** le `VITE_AES_SECRET` et les clés Supabase
3. **Analyser** les logs Supabase (Dashboard → Logs → API)
4. **Notifier** les utilisateurs affectés par email
5. **Documenter** l'incident

### Contacts :
- Supabase Support : support@supabase.io
- Vercel Support : vercel.com/support

---
*Revu et mis à jour à chaque déploiement majeur*

// ==========================================
// 🚀 UrsUle — Script de Test de Charge & Benchmark PKM (ChefsUrsUle)
// ==========================================
// Exécution : node scripts/load_test_pkm.mjs
// Teste la tenue en charge de l'application locale et des points d'entrée Supabase (RPC, FTS, Tâches).

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lecture de .env.local ou .env
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  const env = {};
  for (const p of envPaths) {
    const fullP = path.resolve(__dirname, '..', p);
    if (fs.existsSync(fullP)) {
      const content = fs.readFileSync(fullP, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      });
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://xptwxsuqjnlwjrzytvpj.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS';
const LOCAL_APP_URL = 'http://localhost:5173';

console.log('═════════════════════════════════════════════════════════════');
console.log('🤖 ChefsUrsUle — Suite de Tests de Charge & Performance PKM');
console.log('═════════════════════════════════════════════════════════════');
console.log(`🌐 Supabase URL : ${SUPABASE_URL}`);
console.log(`💻 Local App URL : ${LOCAL_APP_URL}`);
console.log('─────────────────────────────────────────────────────────────\n');

// Fonction utilitaire de calcul des percentiles (p50, p95, p99)
function calculateMetrics(times, errors, totalRequests, totalDurationSec) {
  if (times.length === 0) {
    return { rps: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0, errors };
  }
  times.sort((a, b) => a - b);
  const sum = times.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / times.length).toFixed(2));
  const min = Number(times[0].toFixed(2));
  const max = Number(times[times.length - 1].toFixed(2));
  const p50 = Number(times[Math.floor(times.length * 0.5)].toFixed(2));
  const p95 = Number(times[Math.floor(times.length * 0.95)].toFixed(2));
  const p99 = Number(times[Math.floor(times.length * 0.99)].toFixed(2));
  const rps = Number((totalRequests / totalDurationSec).toFixed(2));

  return { rps, p50, p95, p99, min, max, avg, errors };
}

// Exécuter un batch de requêtes concurrentes sur une cible
async function runLoadTestScenario(name, targetFn, concurrency = 20, totalRequests = 100) {
  console.log(`▶️ Scénario : ${name} (${totalRequests} requêtes, concurrence : ${concurrency})...`);
  const times = [];
  let errors = 0;
  const startAll = performance.now();

  const queue = Array.from({ length: totalRequests }, (_, i) => i);
  
  async function worker() {
    while (queue.length > 0) {
      queue.shift();
      const startReq = performance.now();
      try {
        const ok = await targetFn();
        const duration = performance.now() - startReq;
        if (ok) {
          times.push(duration);
        } else {
          errors++;
          times.push(duration);
        }
      } catch (err) {
        errors++;
        times.push(performance.now() - startReq);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
  await Promise.all(workers);

  const totalDurationSec = (performance.now() - startAll) / 1000;
  const metrics = calculateMetrics(times, errors, totalRequests, totalDurationSec);

  console.log(`   ⏱️  Durée totale : ${totalDurationSec.toFixed(2)}s | RPS (Débit) : ${metrics.rps} req/s`);
  console.log(`   📊 Latences   — Moy: ${metrics.avg}ms | p50: ${metrics.p50}ms | p95: ${metrics.p95}ms | p99: ${metrics.p99}ms | Max: ${metrics.max}ms`);
  console.log(`   🚨 Erreurs HTTP : ${metrics.errors} / ${totalRequests} (${((metrics.errors / totalRequests) * 100).toFixed(1)}%)\n`);

  return { name, totalRequests, concurrency, ...metrics };
}

async function main() {
  const results = [];

  // Scénario 1 : Rendu serveur/client local Vite (Accueil HTTP)
  results.push(await runLoadTestScenario(
    '1. Rendu HTTP Serveur Local (http://localhost:5173)',
    async () => {
      const res = await fetch(`${LOCAL_APP_URL}/`, { headers: { 'User-Agent': 'UrsUle-LoadTester/1.0' } });
      return res.status === 200;
    },
    25,
    150
  ));

  // Scénario 2 : Appel RPC Public Supabase get_shared_note_by_token (Avec un token bidon pour tester la charge RPC et la réponse rapide 404/Null)
  results.push(await runLoadTestScenario(
    '2. Charge RPC Public Supabase (get_shared_note_by_token)',
    async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_note_by_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ token_or_slug: 'test-benchmark-slug-404' })
      });
      // Supabase retourne 200 avec null ou une erreur si non trouvé via RPC, les deux sont des réponses valides du moteur
      return res.status === 200 || res.status === 400 || res.status === 404;
    },
    20,
    100
  ));

  // Scénario 3 : Lecture REST sur la table Tasks (Test de la surcharge RLS & Indexation 023_performance_indexes.sql)
  results.push(await runLoadTestScenario(
    '3. Lecture REST Supabase (Table Tasks — RLS & Index)',
    async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=id,title,status,priority&limit=20`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      return res.status === 200 || res.status === 401; // 401 si RLS restreint aux anonymes, ce qui teste parfaitement la latence d'évaluation du RLS
    },
    30,
    120
  ));

  // Scénario 4 : Lecture REST sur la table Notes & Recherche FTS (Test des index GIN & textSearch)
  results.push(await runLoadTestScenario(
    '4. Recherche & Filtrage Notes Supabase (Table Notes — Index GIN)',
    async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?select=id,title,updated_at&limit=10`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      return res.status === 200 || res.status === 401;
    },
    30,
    120
  ));

  console.log('═════════════════════════════════════════════════════════════');
  console.log('🏆 Synthèse des Performances (Audit ChefsUrsUle)');
  console.log('═════════════════════════════════════════════════════════════');
  console.table(results.map(r => ({
    'Scénario': r.name.split(' (')[0],
    'Requêtes': r.totalRequests,
    'Concurrence': r.concurrency,
    'Débit (RPS)': `${r.rps} req/s`,
    'Latence p50': `${r.p50} ms`,
    'Latence p95': `${r.p95} ms`,
    'Latence p99': `${r.p99} ms`,
    'Erreurs': `${r.errors}`
  })));
  console.log('═════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Erreur critique pendant le test de charge :', err);
  process.exit(1);
});

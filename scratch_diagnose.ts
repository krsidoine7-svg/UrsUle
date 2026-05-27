import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xptwxsuqjnlwjrzytvpj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS'

console.log('🔗 URL Supabase :', supabaseUrl)
console.log('🔑 Clé Publique (début) :', supabaseAnonKey.substring(0, 15) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runDiagnostics() {
  console.log('\n--- 1. Vérification de la connexion publique ---')
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (catError) {
      console.error('❌ Erreur récupération catégories :', catError)
    } else {
      console.log('✅ Connexion OK. Catégories trouvées (sans auth) :', categories)
    }
  } catch (e) {
    console.error('❌ Exception connexion :', e)
  }

  console.log('\n--- 2. Analyse des sessions d\'authentification ---')
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('❌ Erreur session auth :', sessionError)
    } else if (session) {
      console.log('👤 Utilisateur connecté :', session.user.email, 'ID :', session.user.id)
    } else {
      console.log('ℹ️ Aucun utilisateur connecté dans la session CLI.')
    }
  } catch (e) {
    console.error('❌ Exception session :', e)
  }

  // Tenter de lister les profils publics
  console.log('\n--- 3. Vérification de la table profiles ---')
  try {
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profError) {
      console.error('❌ Erreur profils :', profError)
    } else {
      console.log('✅ Profils trouvés :', profiles)
    }
  } catch (e) {
    console.error('❌ Exception profils :', e)
  }
}

runDiagnostics().catch(console.error)

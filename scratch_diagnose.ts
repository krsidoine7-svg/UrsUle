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
      console.error('❌ Erreur profils :', profError.message)
    } else {
      console.log('✅ Profils trouvés (avec RLS) :', profiles)
    }
  } catch (e) {
    console.error('❌ Exception profils :', e)
  }

  // Tenter de lister les flashcards (pour vérifier l'existence de la table)
  console.log('\n--- 3.1 Vérification de la table flashcards ---')
  try {
    const { data: flashcards, error: flashError } = await supabase
      .from('flashcards')
      .select('*')
      .limit(1)
    
    if (flashError) {
      console.error('❌ Erreur flashcards :', flashError.message)
    } else {
      console.log('✅ Table flashcards existe ! (avec RLS) :', flashcards)
    }
  } catch (e) {
    console.error('❌ Exception flashcards :', e)
  }

  // Tenter de lister les notes (pour vérifier l'existence de la table)
  console.log('\n--- 3.2 Vérification de la table notes ---')
  try {
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .limit(1)
    
    if (notesError) {
      console.error('❌ Erreur notes :', notesError.message)
    } else {
      console.log('✅ Table notes existe ! (avec RLS) :', notes)
    }
  } catch (e) {
    console.error('❌ Exception notes :', e)
  }

  // Tenter de lister les notifications (pour vérifier l'existence de la table)
  console.log('\n--- 3.3 Vérification de la table notifications ---')
  try {
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)
    
    if (notifError) {
      console.error('❌ Erreur notifications :', notifError.message)
    } else {
      console.log('✅ Table notifications existe ! (avec RLS) :', notifications)
    }
  } catch (e) {
    console.error('❌ Exception notifications :', e)
  }

  console.log('\n--- 4. Vérification du bucket de stockage task-attachments ---')
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('task-attachments')
    if (bucketError) {
      console.error('❌ Erreur bucket task-attachments :', bucketError.message)
    } else {
      console.log('✅ Bucket task-attachments trouvé !', bucket)
    }
  } catch (e) {
    console.error('❌ Exception bucket :', e)
  }
}

runDiagnostics().catch(console.error)

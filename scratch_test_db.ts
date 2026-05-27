import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xptwxsuqjnlwjrzytvpj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseFlow() {
  const email = `test-${Date.now()}@ursule.com`
  const password = 'Password123!'
  const fullName = 'Test User'

  console.log(`\n--- 1. Enregistrement de l'utilisateur : ${email} ---`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })

  if (signUpError) {
    console.error('❌ Échec de l\'inscription :', signUpError.message)
    return
  }
  
  const userId = signUpData.user?.id
  console.log('✅ Inscription réussie. User ID :', userId)

  console.log('\n--- 2. Connexion explicite pour authentifier le client ---')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('❌ Échec de la connexion :', signInError.message)
    return
  }
  console.log('✅ Connexion réussie. Token de session actif !')

  console.log('\n--- 3. Attente de la création du profil (trigger handle_new_user) ---')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Vérifier le profil
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profError) {
    console.error('❌ Échec récupération profil :', profError.message)
  } else if (profile) {
    console.log('✅ Profil créé par le trigger :', profile)
  } else {
    console.warn('⚠️ Aucun profil trouvé. Le trigger handle_new_user a-t-il planté ?')
  }

  // 4. Insertion manuelle d'une catégorie car le trigger Supabase migrate n'a peut-être pas été appliqué
  console.log('\n--- 4. Insertion manuelle d\'une catégorie de test ---')
  const { data: newCat, error: insertCatError } = await supabase
    .from('categories')
    .insert({
      name: 'Test Personnel',
      color: '#3B82F6',
      user_id: userId
    })
    .select()
    .single()

  if (insertCatError) {
    console.error('❌ Échec de l\'insertion manuelle de la catégorie :', insertCatError.message, 'Code :', insertCatError.code)
    return
  }
  console.log('✅ Catégorie de test créée avec succès :', newCat)

  // 5. Test de création de projet avec deadline vide ou valide
  console.log('\n--- 5. Test de création de projet ---')
  
  // Cas A : Projet avec deadline vide "" (ce que renvoie le front)
  console.log('A. Test avec deadline vide "" (comportement front actuel)...')
  const { data: projA, error: projAError } = await supabase
    .from('projects')
    .insert({
      name: 'Projet Test A',
      description: 'Test vide',
      color: '#10B981',
      icon: 'FolderOpen',
      status: 'active',
      deadline: '', // empty string
      budget: 0,
      user_id: userId
    })
    .select()

  if (projAError) {
    console.log('❌ Échec Projet A (comme prévu !) :', projAError.message, 'Code :', projAError.code)
  } else {
    console.log('✅ Succès inattendu pour Projet A (avec "") :', projA)
  }

  // Cas B : Projet avec deadline NULL (correct)
  console.log('B. Test avec deadline NULL (comportement corrigé)...')
  const { data: projB, error: projBError } = await supabase
    .from('projects')
    .insert({
      name: 'Projet Test B',
      description: 'Test valide',
      color: '#10B981',
      icon: 'FolderOpen',
      status: 'active',
      deadline: null, // null
      budget: 0,
      user_id: userId
    })
    .select()

  if (projBError) {
    console.error('❌ Échec Projet B :', projBError.message)
  } else {
    console.log('✅ Succès Projet B :', projB)
  }

  // 6. Test de création de tâche avec durée vide
  console.log('\n--- 6. Test de création de tâche ---')
  const catId = newCat.id

  // Cas A : Tâche avec estimated_duration_minutes = "" ou null, deadline = ""
  console.log('A. Test avec estimated_duration = null, deadline = ""...')
  const { data: taskA, error: taskAError } = await supabase
    .from('tasks')
    .insert({
      title: 'Tâche Test A',
      priority: 'normal',
      category_id: catId,
      status: 'todo',
      deadline: '', // empty string
      estimated_duration_minutes: null,
      user_id: userId
    })
    .select()

  if (taskAError) {
    console.log('❌ Échec Tâche A :', taskAError.message, 'Code :', taskAError.code)
  } else {
    console.log('✅ Succès pour Tâche A (avec "") :', taskA)
  }

  // Cas B : Tâche avec deadline = NULL, estimated_duration = NULL
  console.log('B. Test avec deadline = NULL, estimated_duration = NULL...')
  const { data: taskB, error: taskBError } = await supabase
    .from('tasks')
    .insert({
      title: 'Tâche Test B',
      priority: 'normal',
      category_id: catId,
      status: 'todo',
      deadline: null,
      estimated_duration_minutes: null,
      user_id: userId
    })
    .select()

  if (taskBError) {
    console.error('❌ Échec Tâche B :', taskBError.message)
  } else {
    console.log('✅ Succès Tâche B :', taskB)
  }
}

testDatabaseFlow().catch(console.error)

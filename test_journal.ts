import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xptwxsuqjnlwjrzytvpj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testJournalIntegration() {
  console.log('--- 1. Authentification pour les tests ---')
  const email = `test-journal-${Date.now()}@ursule.com`
  const password = 'Password123!'

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  })
  if (signUpError) {
    console.error('❌ Échec inscription :', signUpError.message)
    return
  }
  const userId = signUpData.user?.id
  console.log('✅ Inscription réussie. User ID :', userId)

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (signInError) {
    console.error('❌ Échec connexion :', signInError.message)
    return
  }
  console.log('✅ Connexion réussie !')

  // Attendre la création du profil (trigger)
  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log('\n--- 2. Création d\'une note de Journal ---')
  const journalDate = '2026-07-16'
  const journalTitle = 'Jeudi 16 Juillet 2026'
  const journalContent = '### 🌅 Ce que je vais accomplir\n- Tester le journal'

  const { data: newJournal, error: insertErr } = await supabase
    .from('notes')
    .insert({
      title: journalTitle,
      content: journalContent,
      is_journal: true,
      journal_date: journalDate,
      folder_id: null,
      user_id: userId,
      share_permission: 'none'
    })
    .select('*')
    .single()

  if (insertErr) {
    console.error('❌ Échec de la création de la note de journal :', insertErr.message)
    return
  }

  console.log('✅ Journal créé avec succès :', newJournal)
  
  if (newJournal.is_journal !== true || newJournal.journal_date !== journalDate) {
    console.error('❌ Erreur: Les propriétés de journal ne sont pas correctes !')
    return
  }
  console.log('👍 Les propriétés du journal sont valides !')

  console.log('\n--- 3. Récupération de la note de journal ---')
  const { data: fetchedNote, error: fetchErr } = await supabase
    .from('notes')
    .select('*')
    .eq('is_journal', true)
    .eq('journal_date', journalDate)
    .single()

  if (fetchErr) {
    console.error('❌ Échec récupération journal :', fetchErr.message)
    return
  }
  console.log('✅ Journal récupéré depuis la base de données :', fetchedNote)
  
  console.log('\n--- 4. Nettoyage de l\'utilisateur de test ---')
  const { error: deleteErr } = await supabase.from('profiles').delete().eq('id', userId)
  if (deleteErr) {
    console.warn('⚠️ Échec nettoyage profil :', deleteErr.message)
  } else {
    console.log('✅ Nettoyage terminé.')
  }
}

testJournalIntegration().catch(console.error)

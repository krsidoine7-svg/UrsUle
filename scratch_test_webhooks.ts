import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xptwxsuqjnlwjrzytvpj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testWebhooksDB() {
  const email = `test-webhook-${Date.now()}@ursule.com`
  const password = 'Password123!'
  const fullName = 'Webhook Tester'

  console.log(`\n--- 1. Enregistrement de l'utilisateur de test : ${email} ---`)
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

  console.log('\n--- 2. Connexion pour authentifier le client ---')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('❌ Échec de la connexion :', signInError.message)
    return
  }
  console.log('✅ Connexion réussie.')

  console.log('\n--- 3. Insertion d\'un log de webhook ---')
  const { data: newLog, error: logError } = await supabase
    .from('webhook_logs')
    .insert({
      user_id: userId,
      url: 'https://hook.eu2.make.com/mh1hnwggomr759s4j3fopdwfuslbse6t',
      event: 'test',
      success: true
    })
    .select()
    .single()

  if (logError) {
    console.error('❌ Échec de l\'insertion du log de webhook :', logError.message)
  } else {
    console.log('✅ Log inséré avec succès dans la table webhook_logs :', newLog)
  }

  console.log('\n--- 4. Récupération des logs de webhook ---')
  const { data: logs, error: getLogsError } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('user_id', userId)

  if (getLogsError) {
    console.error('❌ Échec de la récupération des logs :', getLogsError.message)
  } else {
    console.log(`✅ Récupération réussie. Nombre de logs : ${logs.length}. Premier log :`, logs[0])
  }
}

testWebhooksDB().catch(console.error)

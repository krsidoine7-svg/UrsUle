
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCRUD() {
  console.log('🚀 Démarrage du test CRUD Supabase...')

  try {
    // 1. CREATE
    console.log('\n1. Création d\'une tâche de test...')
    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert({
        title: 'TEST CRUD ' + new Date().getTime(),
        status: 'todo',
        priority: 'normal'
      })
      .select()
      .single()

    if (createError) throw createError
    console.log('✅ Tâche créée ID:', task.id)

    // 2. READ
    console.log('\n2. Lecture de la tâche...')
    const { data: readTask, error: readError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task.id)
      .single()

    if (readError) throw readError
    console.log('✅ Tâche récupérée:', readTask.title)

    // 3. UPDATE (Soft Delete / Trash)
    console.log('\n3. Mise à la corbeille (Soft Delete)...')
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', task.id)

    if (updateError) throw updateError
    
    const { data: trashedTask } = await supabase
      .from('tasks')
      .select('deleted_at')
      .eq('id', task.id)
      .single()
    
    console.log('✅ Tâche mise à la corbeille le:', trashedTask?.deleted_at)

    // 4. RESTORE
    console.log('\n4. Restauration de la tâche...')
    const { error: restoreError } = await supabase
      .from('tasks')
      .update({ deleted_at: null })
      .eq('id', task.id)

    if (restoreError) throw restoreError
    console.log('✅ Tâche restaurée (deleted_at est NULL)')

    // 5. DELETE PERMANENT
    console.log('\n5. Suppression définitive...')
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (deleteError) throw deleteError
    console.log('✅ Tâche supprimée définitivement.')

    console.log('\n✨ TEST CRUD RÉUSSI ! ✨')

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST:', error)
  }
}

testCRUD()

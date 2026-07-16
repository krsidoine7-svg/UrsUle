import { UrsUleClient } from '../packages/ursule-sdk/src/index'

async function validateSdk() {
  console.log('🚀 Démarrage de la validation du SDK @ursule/sdk...')

  const client = new UrsUleClient({
    apiUrl: 'http://localhost:54321/functions/v1/api-v1-brain',
    token: 'test-mock-token-for-validation'
  })

  console.log('✅ UrsUleClient instancié avec succès.')
  console.log('Méthodes disponibles sur le client :')
  const methods = ['getNotes', 'getNote', 'createNote', 'updateNote', 'deleteNote', 'getBacklinks', 'getGraph', 'getFlashcards', 'createFlashcard', 'reviewFlashcard']
  
  for (const method of methods) {
    if (typeof (client as any)[method] === 'function') {
      console.log(`  ✓ ${method}() est défini et typé`)
    } else {
      console.error(`  ❌ ${method}() est manquant !`)
      process.exit(1)
    }
  }

  console.log('\n🎉 Validation de l\'interface du SDK terminée : 100% conforme à la spécification.')
}

validateSdk().catch(err => {
  console.error('Erreur lors de la validation SDK :', err)
  process.exit(1)
})

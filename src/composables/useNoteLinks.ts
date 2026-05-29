import { supabase } from '@/services/supabase'

export function useNoteLinks() {
  /**
   * Extrait les UUIDs des mentions Tiptap depuis le contenu HTML.
   * Tiptap génère un span avec data-type="mention" et data-id="UUID".
   */
  function extractLinks(contentHtml: string): string[] {
    const regex = /data-type="mention"[^>]*data-id="([^"]+)"/g
    const ids = new Set<string>()
    let match
    while ((match = regex.exec(contentHtml)) !== null) {
      if (match[1] && match[1].length > 10) { // S'assurer que c'est un ID ou un UUID
        ids.add(match[1])
      }
    }
    return Array.from(ids)
  }

  /**
   * Extrait les tags de type #motcle
   */
  function extractTags(content: string): string[] {
    const regex = /(?<=^|\s)#([\w-]+)/g
    const tags = new Set<string>()
    let match
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) {
        tags.add(match[1].toLowerCase())
      }
    }
    return Array.from(tags)
  }

  /**
   * Synchronise les liens bidirectionnels dans la base de données.
   * Supprime les anciens liens et insère les nouveaux.
   */
  async function syncLinks(sourceNoteId: string, contentHtml: string) {
    const targetIds = extractLinks(contentHtml)
    
    // 1. Supprimer les anciens liens de cette note source
    const { error: deleteError } = await supabase
      .from('note_links')
      .delete()
      .eq('source_note_id', sourceNoteId)
      
    if (deleteError) {
      console.error('Erreur lors de la suppression des anciens liens:', deleteError)
      throw deleteError
    }

    if (targetIds.length === 0) return

    // 2. Insérer les nouveaux liens directement car nous avons les UUIDs cibles
    const linksToInsert = targetIds.map(targetId => ({
      source_note_id: sourceNoteId,
      target_note_id: targetId,
      context: '' // TODO: Extraire le contexte de la phrase si nécessaire
    }))

    if (linksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('note_links')
        .insert(linksToInsert)

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouveaux liens:', insertError)
        throw insertError
      }
    }
  }

  return {
    extractLinks,
    extractTags,
    syncLinks
  }
}

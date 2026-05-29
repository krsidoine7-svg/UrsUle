import { supabase } from './supabase'

export interface GraphNode {
  id: string
  title: string
  tags: string[]
  folder_id: string | null
  color?: string
  degree: number // Nombre de liens connectés
}

export interface GraphEdge {
  source: string // L'ID du noeud source (D3 remplacera par l'objet noeud après initialisation)
  target: string // L'ID du noeud cible
  context?: string
}

export const linksService = {
  async getGraphData(): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    // 1. Récupérer toutes les notes non supprimées
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, tags, folder_id, color')
      .eq('user_id', user.user.id)
      .is('deleted_at', null)

    if (notesError) throw notesError

    const noteIds = notes.map(n => n.id)
    if (noteIds.length === 0) {
      return { nodes: [], edges: [] }
    }

    // 2. Récupérer tous les liens où la source ou la cible est parmi ces notes
    // (Dans un cas idéal, on filtre les liens de l'utilisateur. Ici on utilise in())
    const { data: links, error: linksError } = await supabase
      .from('note_links')
      .select('source_note_id, target_note_id, context')
      .in('source_note_id', noteIds)

    if (linksError) throw linksError

    // 3. Formater les arêtes et calculer le degré de chaque nœud
    const edges: GraphEdge[] = []
    const degrees: Record<string, number> = {}

    links.forEach(link => {
      // Ignorer les liens cassés (vers une note supprimée par exemple)
      if (noteIds.includes(link.source_note_id) && noteIds.includes(link.target_note_id)) {
        edges.push({
          source: link.source_note_id,
          target: link.target_note_id,
          context: link.context
        })

        degrees[link.source_note_id] = (degrees[link.source_note_id] || 0) + 1
        degrees[link.target_note_id] = (degrees[link.target_note_id] || 0) + 1
      }
    })

    // 4. Formater les nœuds
    const nodes: GraphNode[] = notes.map(n => ({
      id: n.id,
      title: n.title,
      tags: n.tags || [],
      folder_id: n.folder_id,
      color: n.color,
      degree: degrees[n.id] || 0
    }))

    return { nodes, edges }
  }
}

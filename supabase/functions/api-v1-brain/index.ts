// @ts-expect-error: Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error: Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authentification & Sécurité SSRF / RLS
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // @ts-expect-error: Deno is available in Edge Functions
    const supabaseClient = createClient(
      // @ts-expect-error: Deno env
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno env
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const resource = url.searchParams.get('resource') || url.pathname.split('/').pop() || ''
    const id = url.searchParams.get('id')

    // Parse body for POST / PUT
    let body: any = {}
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    // ─── ENDPOINT: notes ──────────────────────────────────────
    if (resource === 'notes' || resource === 'note') {
      if (method === 'GET' && id) {
        // Get single note + backlinks
        const { data: note, error: noteError } = await supabaseClient
          .from('notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single()

        if (noteError) throw noteError

        // Backlinks sortants et entrants
        const { data: outgoing } = await supabaseClient
          .from('note_backlinks')
          .select('target_note_id, notes!target_note_id(title)')
          .eq('source_note_id', id)
        
        const { data: incoming } = await supabaseClient
          .from('note_backlinks')
          .select('source_note_id, notes!source_note_id(title)')
          .eq('target_note_id', id)

        return new Response(
          JSON.stringify({ note, backlinks: { outgoing: outgoing || [], incoming: incoming || [] } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'GET') {
        // List notes with optional query/tag filter
        const query = url.searchParams.get('query')
        const tag = url.searchParams.get('tag')
        const folderId = url.searchParams.get('folder_id')

        let q = supabaseClient
          .from('notes')
          .select('id, title, excerpt, folder_id, is_pinned, created_at, updated_at, linked_task_id, linked_project_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })

        if (folderId) q = q.eq('folder_id', folderId)
        if (query) q = q.ilike('title', `%${query}%`)

        const { data: notes, error } = await q
        if (error) throw error

        let filteredNotes = notes || []
        if (tag) {
          const { data: tagLinks } = await supabaseClient
            .from('note_tags')
            .select('note_id, tags!inner(name)')
            .eq('tags.name', tag)
            .eq('tags.user_id', user.id)
          const tagNoteIds = new Set((tagLinks || []).map(t => t.note_id))
          filteredNotes = filteredNotes.filter(n => tagNoteIds.has(n.id))
        }

        return new Response(
          JSON.stringify({ notes: filteredNotes, count: filteredNotes.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'POST') {
        // Create note
        const { title, content_html, folder_id, linked_task_id, linked_project_id, excerpt } = body
        const { data: newNote, error } = await supabaseClient
          .from('notes')
          .insert({
            user_id: user.id,
            title: title || 'Nouvelle note',
            content_html: content_html || '',
            folder_id: folder_id || null,
            linked_task_id: linked_task_id || null,
            linked_project_id: linked_project_id || null,
            excerpt: excerpt || (content_html ? content_html.replace(/<[^>]*>?/gm, '').substring(0, 150) : ''),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ note: newNote }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'PUT' && id) {
        // Update note
        const updates = { ...body, updated_at: new Date().toISOString() }
        delete updates.id
        delete updates.user_id

        const { data: updatedNote, error } = await supabaseClient
          .from('notes')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ note: updatedNote }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'DELETE' && id) {
        // Soft delete note
        const { error } = await supabaseClient
          .from('notes')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ─── ENDPOINT: backlinks ──────────────────────────────────
    if (resource === 'backlinks') {
      const noteId = url.searchParams.get('note_id')
      let q = supabaseClient.from('note_backlinks').select('*').eq('user_id', user.id)
      if (noteId) {
        q = q.or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`)
      }
      const { data: backlinks, error } = await q
      if (error) throw error

      return new Response(
        JSON.stringify({ backlinks: backlinks || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── ENDPOINT: graph ──────────────────────────────────────
    if (resource === 'graph') {
      const { data: notes, error: notesErr } = await supabaseClient
        .from('notes')
        .select('id, title, folder_id, is_pinned, updated_at, linked_task_id, linked_project_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (notesErr) throw notesErr

      const { data: backlinks, error: linksErr } = await supabaseClient
        .from('note_backlinks')
        .select('source_note_id, target_note_id')
        .eq('user_id', user.id)

      if (linksErr) throw linksErr

      const validIds = new Set((notes || []).map(n => n.id))
      const edges = (backlinks || []).filter(b => validIds.has(b.source_note_id) && validIds.has(b.target_note_id))

      const nodes = (notes || []).map(n => ({
        id: n.id,
        label: n.title,
        folder_id: n.folder_id,
        is_pinned: n.is_pinned,
        linked_type: n.linked_task_id ? 'task' : n.linked_project_id ? 'project' : null
      }))

      return new Response(
        JSON.stringify({ nodes, edges, count: nodes.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── ENDPOINT: flashcards ─────────────────────────────────
    if (resource === 'flashcards') {
      if (method === 'GET') {
        const folderId = url.searchParams.get('folder_id')
        const dueOnly = url.searchParams.get('due') === 'true'

        let q = supabaseClient
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)

        if (folderId) q = q.eq('folder_id', folderId)
        if (dueOnly) {
          const now = new Date().toISOString()
          q = q.lte('next_review_at', now)
        }

        const { data: flashcards, error } = await q
        if (error) throw error

        return new Response(
          JSON.stringify({ flashcards: flashcards || [], count: (flashcards || []).length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'POST' && url.pathname.endsWith('/review')) {
        // Review flashcard
        const { flashcard_id, quality } = body
        if (!flashcard_id || quality === undefined) {
          return new Response(
            JSON.stringify({ error: 'Missing flashcard_id or quality (0-5)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: card, error: cardErr } = await supabaseClient
          .from('flashcards')
          .select('*')
          .eq('id', flashcard_id)
          .eq('user_id', user.id)
          .single()

        if (cardErr || !card) throw cardErr || new Error('Flashcard not found')

        // Calcul Leitner simple ou Leitner boxes (1-5)
        let newBox = card.box || 1
        if (quality >= 3) {
          newBox = Math.min(newBox + 1, 5)
        } else {
          newBox = 1
        }

        const daysToAdd = [1, 3, 7, 14, 30][newBox - 1] || 1
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + daysToAdd)

        const { data: updatedCard, error: updErr } = await supabaseClient
          .from('flashcards')
          .update({
            box: newBox,
            next_review_at: nextReview.toISOString(),
            last_reviewed_at: new Date().toISOString(),
            review_count: (card.review_count || 0) + 1
          })
          .eq('id', flashcard_id)
          .select()
          .single()

        if (updErr) throw updErr

        return new Response(
          JSON.stringify({ flashcard: updatedCard, next_review_at: updatedCard.next_review_at }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (method === 'POST') {
        // Create flashcard
        const { front, back, note_id, folder_id, tags } = body
        if (!front || !back) {
          return new Response(
            JSON.stringify({ error: 'Missing front or back content' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newCard, error } = await supabaseClient
          .from('flashcards')
          .insert({
            user_id: user.id,
            front,
            back,
            note_id: note_id || null,
            folder_id: folder_id || null,
            tags: tags || [],
            box: 1,
            next_review_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ flashcard: newCard }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: `Unknown resource or method. Supported resources: notes, backlinks, graph, flashcards` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('API v1 Brain Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

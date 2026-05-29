import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { notesService } from '@/services/notes.service'
import { foldersService, type CreateFolderDTO, type UpdateFolderDTO, type FolderTreeNode } from '@/services/folders.service'
import type { Note, NoteFolder, CreateNoteDTO, UpdateNoteDTO } from '@/types/brain.types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const folders = ref<NoteFolder[]>([])
  const deletedNotes = ref<Note[]>([])
  const deletedFolders = ref<NoteFolder[]>([])
  const activeNote = ref<Note | null>(null)
  const selectedFolder = ref<string | null>(null)
  const searchQuery = ref<string>('')
  
  const loading = ref(false)
  const loadingTrash = ref(false)
  const error = ref<string | null>(null)
  
  // État réactif des dossiers dépliés/expansés
  const expandedFolders = ref<Record<string, boolean>>({})

  const filteredNotes = computed(() => {
    return notes.value.filter(n => {
      const matchSearch = searchQuery.value ? n.title.toLowerCase().includes(searchQuery.value.toLowerCase()) : true
      const matchFolder = selectedFolder.value ? n.folder_id === selectedFolder.value : true
      return matchSearch && matchFolder
    })
  })

  const folderTree = computed(() => foldersService.buildTree(folders.value))

  // ─── Fetch ──────────────────────────────────────────────────────

  async function fetchNotes() {
    loading.value = true
    try {
      notes.value = await notesService.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchFolders() {
    try {
      folders.value = await foldersService.getAll()
    } catch (e: any) {
      error.value = e.message
    }
  }

  /** Charge la corbeille (notes et dossiers supprimés) */
  async function fetchTrash() {
    loadingTrash.value = true
    try {
      const [deletedNotesData, deletedFoldersData] = await Promise.all([
        notesService.getDeleted(),
        foldersService.getDeleted()
      ])
      deletedNotes.value = deletedNotesData
      deletedFolders.value = deletedFoldersData
    } catch (e: any) {
      error.value = e.message
    } finally {
      loadingTrash.value = false
    }
  }

  // ─── Folder Expansion ───────────────────────────────────────────

  function toggleFolderExpanded(id: string) {
    expandedFolders.value[id] = !expandedFolders.value[id]
  }

  function isFolderExpanded(id: string): boolean {
    return !!expandedFolders.value[id]
  }

  function setFolderExpanded(id: string, isExpanded: boolean) {
    expandedFolders.value[id] = isExpanded
  }

  // ─── Folder CRUD ────────────────────────────────────────────────

  async function createFolder(dto: CreateFolderDTO) {
    try {
      const newFolder = await foldersService.create(dto)
      folders.value.push(newFolder)
      
      // Si c'est un sous-dossier, on force l'expansion réactive du dossier parent
      if (dto.parent_id) {
        expandedFolders.value[dto.parent_id] = true
      }
      
      return newFolder
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  async function updateFolder(id: string, dto: UpdateFolderDTO) {
    try {
      const updated = await foldersService.update(id, dto)
      const index = folders.value.findIndex(f => f.id === id)
      if (index !== -1) {
        folders.value[index] = { ...folders.value[index], ...updated }
      }
      return updated
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Soft-delete : envoie le dossier à la corbeille */
  async function deleteFolder(id: string) {
    try {
      await foldersService.softDelete(id)
      // Retirer du store les dossiers affectés (le dossier et ses enfants via trigger)
      // On recharge pour avoir l'état exact après le trigger de cascade
      await fetchFolders()
      // Mettre à null le folder_id des notes orphelines côté client
      notes.value = notes.value.map(n => n.folder_id === id ? { ...n, folder_id: undefined } : n)
      if (selectedFolder.value === id) selectedFolder.value = null
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Restaure un dossier depuis la corbeille */
  async function restoreFolder(id: string) {
    try {
      await foldersService.restore(id)
      deletedFolders.value = deletedFolders.value.filter(f => f.id !== id)
      await fetchFolders()
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Supprime définitivement un dossier (irréversible) */
  async function deleteFolderPermanent(id: string) {
    try {
      await foldersService.deletePermanent(id)
      deletedFolders.value = deletedFolders.value.filter(f => f.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  // ─── Note CRUD ──────────────────────────────────────────────────

  async function createNote(dto: CreateNoteDTO) {
    loading.value = true
    try {
      const finalDto = { ...dto }
      if (selectedFolder.value && finalDto.folder_id === undefined) {
        finalDto.folder_id = selectedFolder.value
      }

      const newNote = await notesService.create(finalDto)
      notes.value.unshift(newNote)
      return newNote
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateNote(id: string, dto: UpdateNoteDTO) {
    try {
      const updated = await notesService.update(id, dto)
      const index = notes.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notes.value[index] = { ...notes.value[index], ...updated }
      }
      if (activeNote.value?.id === id) {
        activeNote.value = { ...activeNote.value, ...updated }
      }
      return updated
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Soft-delete : envoie la note à la corbeille */
  async function deleteNote(id: string) {
    try {
      await notesService.softDelete(id)
      notes.value = notes.value.filter(n => n.id !== id)
      if (activeNote.value?.id === id) {
        activeNote.value = null
      }
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Restaure une note depuis la corbeille */
  async function restoreNote(id: string) {
    try {
      await notesService.restore(id)
      deletedNotes.value = deletedNotes.value.filter(n => n.id !== id)
      await fetchNotes()
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Supprime définitivement une note (irréversible) */
  async function deleteNotePermanent(id: string) {
    try {
      await notesService.deletePermanent(id)
      deletedNotes.value = deletedNotes.value.filter(n => n.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /** Calcule l'impact d'une suppression de note (backlinks, flashcards) */
  async function getNoteImpact(id: string) {
    return notesService.getDeletionImpact(id)
  }

  // ─── Active Note ────────────────────────────────────────────────

  function setActiveNote(id: string | null) {
    if (!id) {
      activeNote.value = null
      return
    }
    const note = notes.value.find(n => n.id === id)
    if (note) activeNote.value = note
  }

  function setSelectedFolder(id: string | null) {
    selectedFolder.value = id
  }

  // ─── Realtime ───────────────────────────────────────────────────

  async function handleRealtimeFolderChange(payload: any) {
    console.log('Realtime folder change received:', payload)
    await fetchFolders()
  }

  async function handleRealtimeNoteChange(payload: any) {
    console.log('Realtime note change received:', payload)
    await fetchNotes()
    
    if (activeNote.value && (payload.new?.id === activeNote.value.id || payload.old?.id === activeNote.value.id)) {
      if (payload.eventType === 'DELETE') {
        activeNote.value = null
      } else {
        const updatedNote = notes.value.find(n => n.id === activeNote.value!.id)
        if (updatedNote) activeNote.value = updatedNote
      }
    }
  }

  function subscribeToNotesAndFolders() {
    const foldersChannel = supabase
      .channel('folders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'note_folders' },
        (payload) => handleRealtimeFolderChange(payload)
      )
      .subscribe()

    const notesChannel = supabase
      .channel('notes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => handleRealtimeNoteChange(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(foldersChannel)
      supabase.removeChannel(notesChannel)
    }
  }

  return {
    notes,
    folders,
    deletedNotes,
    deletedFolders,
    activeNote,
    selectedFolder,
    searchQuery,
    loading,
    loadingTrash,
    error,
    filteredNotes,
    folderTree,
    expandedFolders,
    fetchNotes,
    fetchFolders,
    fetchTrash,
    createFolder,
    updateFolder,
    deleteFolder,
    restoreFolder,
    deleteFolderPermanent,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    deleteNotePermanent,
    getNoteImpact,
    setActiveNote,
    setSelectedFolder,
    toggleFolderExpanded,
    isFolderExpanded,
    setFolderExpanded,
    subscribeToNotesAndFolders
  }
})

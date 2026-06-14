import { ref } from 'vue'
import { supabase } from './supabase'

const googleToken = ref<string | null>(localStorage.getItem('ursule_google_access_token'))
const isConnected = ref<boolean>(localStorage.getItem('ursule_google_connected') === 'true')
const lastSyncDate = ref<string | null>(localStorage.getItem('ursule_google_last_sync'))
const isSyncing = ref<boolean>(false)

export const driveService = {
  googleToken,
  isConnected,
  lastSyncDate,
  isSyncing,

  // Déclencher l'association du compte Google via Supabase OAuth
  async connectGoogle() {
    const redirectTo = `${window.location.origin}/settings`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        scopes: 'https://www.googleapis.com/auth/drive.file'
      }
    })

    if (error) throw error
    return data
  },

  // Enregistrer le token extrait d'une session Supabase active (OAuth callback)
  saveTokenFromSession(session: any) {
    if (session?.provider_token) {
      googleToken.value = session.provider_token
      localStorage.setItem('ursule_google_access_token', session.provider_token)
      isConnected.value = true
      localStorage.setItem('ursule_google_connected', 'true')
    }
    if (session?.provider_refresh_token) {
      localStorage.setItem('ursule_google_refresh_token', session.provider_refresh_token)
    }
  },

  // Déconnecter Google (supprimer les tokens locaux)
  disconnectGoogle() {
    googleToken.value = null
    isConnected.value = false
    lastSyncDate.value = null
    localStorage.removeItem('ursule_google_access_token')
    localStorage.removeItem('ursule_google_refresh_token')
    localStorage.removeItem('ursule_google_connected')
    localStorage.removeItem('ursule_google_last_sync')
  },

  // Générer le payload JSON complet avec toutes les données utilisateur
  async generateBackupPayload(): Promise<any> {
    const { data: categories } = await supabase.from('categories').select('*')
    const { data: projects } = await supabase.from('projects').select('*')
    const { data: tasks } = await supabase.from('tasks').select('*')
    const { data: folders } = await supabase.from('note_folders').select('*')
    const { data: notes } = await supabase.from('notes').select('*')
    const { data: links } = await supabase.from('note_links').select('*')
    const { data: flashcards } = await supabase.from('flashcards').select('*')
    const { data: mindMaps } = await supabase.from('mind_maps').select('*')

    return {
      version: '1.0.0',
      backup_date: new Date().toISOString(),
      data: {
        categories: categories || [],
        projects: projects || [],
        tasks: tasks || [],
        note_folders: folders || [],
        notes: notes || [],
        note_links: links || [],
        flashcards: flashcards || [],
        mind_maps: mindMaps || []
      }
    }
  },

  // Sauvegarder (créer ou écraser) les données vers Google Drive
  async uploadBackupToDrive() {
    if (!googleToken.value) {
      throw new Error('Non connecté à Google Drive')
    }

    isSyncing.value = true
    try {
      const backupPayload = await this.generateBackupPayload()

      // 1. Rechercher si le fichier existe déjà
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='ursule-backup.json' and trashed=false`,
        {
          headers: {
            Authorization: `Bearer ${googleToken.value}`
          }
        }
      )

      if (searchRes.status === 401) {
        this.disconnectGoogle()
        throw new Error('Session Google expirée. Veuillez vous reconnecter.')
      }

      const searchData = await searchRes.json()
      const existingFile = searchData.files && searchData.files[0]

      if (existingFile) {
        // 2. Mettre à jour le fichier existant
        const fileId = existingFile.id
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${googleToken.value}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(backupPayload)
          }
        )

        if (!updateRes.ok) {
          throw new Error(`Erreur lors de la mise à jour de la sauvegarde : ${updateRes.statusText}`)
        }
      } else {
        // 3. Créer un nouveau fichier (multipart upload)
        const metadata = {
          name: 'ursule-backup.json',
          mimeType: 'application/json'
        }

        const boundary = 'ursule_boundary_drive'
        const body = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: application/json',
          '',
          JSON.stringify(backupPayload),
          `--${boundary}--`
        ].join('\r\n')

        const createRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${googleToken.value}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body
          }
        )

        if (!createRes.ok) {
          throw new Error(`Erreur lors de la création de la sauvegarde : ${createRes.statusText}`)
        }
      }

      // 4. Mettre à jour le timestamp de dernière sync
      const nowString = new Date().toISOString()
      lastSyncDate.value = nowString
      localStorage.setItem('ursule_google_last_sync', nowString)

    } finally {
      isSyncing.value = false
    }
  },

  // Télécharger la sauvegarde depuis Google Drive
  async downloadBackupFromDrive(): Promise<any> {
    if (!googleToken.value) {
      throw new Error('Non connecté à Google Drive')
    }

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='ursule-backup.json' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${googleToken.value}`
        }
      }
    )

    if (searchRes.status === 401) {
      this.disconnectGoogle()
      throw new Error('Session Google expirée. Veuillez vous reconnecter.')
    }

    const searchData = await searchRes.json()
    const file = searchData.files && searchData.files[0]

    if (!file) {
      throw new Error('Aucune sauvegarde trouvée sur Google Drive.')
    }

    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${googleToken.value}`
        }
      }
    )

    if (!downloadRes.ok) {
      throw new Error(`Impossible de télécharger la sauvegarde : ${downloadRes.statusText}`)
    }

    return await downloadRes.json()
  },

  // Restaurer les données téléchargées en base de données Supabase
  async restoreBackupData(backup: any) {
    if (!backup.data) {
      throw new Error('Format de sauvegarde invalide.')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const d = backup.data

    // Restaurer par ordre de dépendance (catégories -> projets -> tâches -> notes/flashcards)
    if (d.categories && d.categories.length > 0) {
      // S'assurer que le user_id correspond bien à l'utilisateur connecté
      const formatted = d.categories.map((c: any) => ({ ...c, user_id: user.id }))
      const { error } = await supabase.from('categories').upsert(formatted)
      if (error) throw error
    }

    if (d.projects && d.projects.length > 0) {
      const formatted = d.projects.map((p: any) => ({ ...p, user_id: user.id }))
      const { error } = await supabase.from('projects').upsert(formatted)
      if (error) throw error
    }

    if (d.tasks && d.tasks.length > 0) {
      const formatted = d.tasks.map((t: any) => ({ ...t, user_id: user.id }))
      const { error } = await supabase.from('tasks').upsert(formatted)
      if (error) throw error
    }

    if (d.note_folders && d.note_folders.length > 0) {
      const formatted = d.note_folders.map((f: any) => ({ ...f, user_id: user.id }))
      const { error } = await supabase.from('note_folders').upsert(formatted)
      if (error) throw error
    }

    if (d.notes && d.notes.length > 0) {
      const formatted = d.notes.map((n: any) => ({ ...n, user_id: user.id }))
      const { error } = await supabase.from('notes').upsert(formatted)
      if (error) throw error
    }

    if (d.note_links && d.note_links.length > 0) {
      const { error } = await supabase.from('note_links').upsert(d.note_links)
      if (error) throw error
    }

    if (d.flashcards && d.flashcards.length > 0) {
      const formatted = d.flashcards.map((f: any) => ({ ...f, user_id: user.id }))
      const { error } = await supabase.from('flashcards').upsert(formatted)
      if (error) throw error
    }

    if (d.mind_maps && d.mind_maps.length > 0) {
      const formatted = d.mind_maps.map((m: any) => ({ ...m, user_id: user.id }))
      const { error } = await supabase.from('mind_maps').upsert(formatted)
      if (error) throw error
    }
  }
}

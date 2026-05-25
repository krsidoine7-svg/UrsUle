import { supabase } from './supabase'

export const storageService = {
  async uploadImage(file: File, taskId: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    // Validation
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) throw new Error('L\'image est trop lourde (max 5MB)')
    if (!file.type.startsWith('image/')) throw new Error('Seules les images sont autorisées')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${taskId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('task-attachments') // On utilise task-attachments comme convenu
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data, error: dbError } = await supabase
      .from('task_images')
      .insert({
        task_id: taskId,
        user_id: user.id,
        storage_path: filePath,
        filename: file.name,
        size_bytes: file.size,
        mime_type: file.type
      })
      .select()
      .single()

    if (dbError) throw dbError
    
    // Générer une URL signée immédiatement pour le retour
    const signedUrl = await this.getSignedUrl(filePath)
    return { ...data, signedUrl }
  },

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(path, 3600) // 1 heure

    if (error) throw error
    return data.signedUrl
  },

  async deleteImage(imageId: string, storagePath: string): Promise<void> {
    // 1. Supprimer du stockage
    const { error: storageError } = await supabase.storage
      .from('task-attachments')
      .remove([storagePath])

    if (storageError) console.error('Erreur Storage lors de la suppression:', storageError)

    // 2. Supprimer de la DB
    const { error: dbError } = await supabase
      .from('task_images')
      .delete()
      .eq('id', imageId)

    if (dbError) throw dbError
  },

  async getTaskImages(taskId: string): Promise<any[]> {
    const { data: images, error } = await supabase
      .from('task_images')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Générer les URLs signées pour chaque image
    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        try {
          const signedUrl = await this.getSignedUrl(img.storage_path)
          return { ...img, signedUrl }
        } catch (e) {
          return { ...img, signedUrl: '' }
        }
      })
    )

    return imagesWithUrls
  }
}

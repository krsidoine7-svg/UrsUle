import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoriesService } from '@/services/categories.service'
import type { Category } from '@/types/user.types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let fetchPromise: Promise<void> | null = null

  async function fetchCategories() {
    if (fetchPromise) return fetchPromise
    
    fetchPromise = (async () => {
      loading.value = true
    try {
      const data = await categoriesService.getAll()
      
      // --- Self-healing : Nettoyage des doublons et ajout des manquants ---
      const uniqueNames = new Set<string>()
      const duplicates: string[] = []
      
      for (const cat of data) {
        if (uniqueNames.has(cat.name)) duplicates.push(cat.id)
        else uniqueNames.add(cat.name)
      }
      
      // Supprimer les doublons causés par la double exécution précédente
      if (duplicates.length > 0) {
        for (const id of duplicates) await categoriesService.delete(id)
      }
      
      // Vérifier et ajouter les catégories par défaut manquantes
      const defaultCats = [
        { name: 'Personnel', color: '#3B82F6', icon: 'user' },
        { name: 'Travail', color: '#2563EB', icon: 'briefcase' },
        { name: 'Apprentissage', color: '#8B5CF6', icon: 'book-open' },
        { name: 'Finance', color: '#16A34A', icon: 'dollar-sign' },
        { name: 'Santé', color: '#EF4444', icon: 'heart' },
        { name: 'Projets', color: '#F59E0B', icon: 'folder-open' }
      ]
      
      let wasModified = duplicates.length > 0
      for (const def of defaultCats) {
        if (!uniqueNames.has(def.name)) {
          await createCategory(def.name, def.color, def.icon)
          wasModified = true
        }
      }
      
      if (wasModified) {
        categories.value = await categoriesService.getAll()
      } else {
        categories.value = data
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
      fetchPromise = null
    }
  })()
  
  return fetchPromise
}

  async function createCategory(name: string, color: string, icon?: string) {
    loading.value = true
    try {
      const category = await categoriesService.create(name, color, icon)
      categories.value.push(category)
      return category
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: string, updates: Partial<Category>) {
    loading.value = true
    try {
      const updated = await categoriesService.update(id, updates)
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx !== -1) categories.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string) {
    loading.value = true
    try {
      await categoriesService.delete(id)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
})

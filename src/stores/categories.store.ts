import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoriesService } from '@/services/categories.service'
import type { Category } from '@/types/user.types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    try {
      categories.value = await categoriesService.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
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

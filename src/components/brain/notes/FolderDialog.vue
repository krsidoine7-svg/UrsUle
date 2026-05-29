<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes.store'
import { Button } from '@/components/ui/button'
import { 
  X, Folder, Book, Rocket, Brain, Code, Calendar, 
  Star, Heart, Database, GraduationCap, Lightbulb, 
  FileText, Tag, Compass, Briefcase, Target, FolderPlus,
  Check
} from 'lucide-vue-next'
import type { FolderTreeNode } from '@/services/folders.service'

const props = defineProps<{
  mode: 'create' | 'edit'
  parentId?: string | null
  folder?: FolderTreeNode | null
}>()

const emit = defineEmits(['close', 'saved'])

const notesStore = useNotesStore()

const folderName = ref('')
const selectedColor = ref('#3B82F6')
const selectedIcon = ref('Folder')

// Liste des icônes Lucide disponibles
const availableIcons = {
  Folder,
  Book,
  Rocket,
  Brain,
  Code,
  Calendar,
  Star,
  Heart,
  Database,
  GraduationCap,
  Lightbulb,
  FileText,
  Tag,
  Compass,
  Briefcase,
  Target
}

const colors = [
  '#ef4444', // Rouge
  '#f97316', // Orange
  '#f59e0b', // Ambre
  '#10b981', // Émeraude
  '#06b6d4', // Cyan
  '#3b82f6', // Bleu
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#64748b'  // Ardoise
]

const parentFolderName = computed(() => {
  if (!props.parentId) return null
  const parent = notesStore.folders.find(f => f.id === props.parentId)
  return parent ? parent.name : null
})

onMounted(() => {
  if (props.mode === 'edit' && props.folder) {
    folderName.value = props.folder.name
    selectedColor.value = props.folder.color || '#3B82F6'
    selectedIcon.value = props.folder.icon && availableIcons[props.folder.icon as keyof typeof availableIcons] ? props.folder.icon : 'Folder'
  }
})

const isSubmitting = ref(false)

async function handleSubmit() {
  if (!folderName.value.trim()) return

  isSubmitting.value = true
  try {
    if (props.mode === 'create') {
      await notesStore.createFolder({
        name: folderName.value.trim(),
        parent_id: props.parentId || null,
        color: selectedColor.value,
        icon: selectedIcon.value
      })
    } else if (props.mode === 'edit' && props.folder) {
      await notesStore.updateFolder(props.folder.id, {
        name: folderName.value.trim(),
        color: selectedColor.value,
        icon: selectedIcon.value
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save folder', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
    <div 
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-neutral-100 overflow-hidden transform transition-all flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div>
          <h3 class="text-xl font-bold text-neutral-900">
            {{ mode === 'create' ? (parentId ? 'Nouveau sous-dossier' : 'Nouveau dossier') : 'Gérer le dossier' }}
          </h3>
          <p class="text-xs text-neutral-500 font-semibold">
            {{ parentId ? `Créé à l'intérieur de : ${parentFolderName}` : 'Organisez vos notes par sujet' }}
          </p>
        </div>
        <button 
          @click="emit('close')" 
          class="p-2 hover:bg-neutral-200/60 rounded-xl text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        
        <!-- Nom du dossier -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Nom du dossier</label>
          <input 
            v-model="folderName"
            placeholder="ex: Cours, Projets, Idées..."
            class="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm"
            required
            maxlength="40"
            ref="inputRef"
            v-focus
          />
        </div>

        <!-- Palette de couleurs -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">Couleur d'identification</label>
          <div class="flex flex-wrap gap-2.5 justify-between">
            <button 
              v-for="color in colors" 
              :key="color"
              type="button"
              @click="selectedColor = color"
              class="w-7 h-7 rounded-full border border-black/5 flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95"
              :style="{ backgroundColor: color }"
            >
              <Check v-if="selectedColor === color" class="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
            </button>
          </div>
        </div>

        <!-- Palette d'icônes Lucide -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">Icône d'illustration</label>
          <div class="grid grid-cols-8 gap-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
            <button
              v-for="(iconComp, iconName) in availableIcons"
              :key="iconName"
              type="button"
              @click="selectedIcon = iconName"
              class="aspect-square rounded-lg flex items-center justify-center border transition-all duration-200"
              :class="selectedIcon === iconName 
                ? 'bg-white border-primary-500 text-primary-600 shadow-sm scale-110' 
                : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-200/50 hover:text-neutral-700'"
              :title="iconName"
            >
              <component :is="iconComp" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-2 flex gap-3">
          <Button 
            type="button"
            variant="outline"
            class="flex-1 py-2.5 rounded-xl border-neutral-200 font-bold"
            @click="emit('close')"
          >
            Annuler
          </Button>
          
          <Button 
            type="submit" 
            :disabled="isSubmitting || !folderName.trim()"
            class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow-md gap-2"
          >
            <FolderPlus class="w-4 h-4 text-white" />
            {{ mode === 'create' ? 'Créer' : 'Sauvegarder' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
// Directive focus automatique
export const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}
</script>

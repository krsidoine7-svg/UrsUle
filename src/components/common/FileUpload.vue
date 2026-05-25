<script setup lang="ts">
import { ref } from 'vue'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  maxFiles?: number
  currentCount?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'upload', file: File): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    processFiles(target.files)
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files.length) {
    processFiles(e.dataTransfer.files)
  }
}

const processFiles = (files: FileList) => {
  const max = props.maxFiles || 5
  const current = props.currentCount || 0
  
  if (current + files.length > max) {
    alert(`Tu ne peux pas ajouter plus de ${max} images.`)
    return
  }

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      emit('upload', file)
    } else {
      alert('Seules les images sont autorisées.')
    }
  })
}
</script>

<template>
  <div 
    class="relative group"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input 
      type="file" 
      ref="fileInput"
      class="hidden" 
      accept="image/*"
      multiple
      @change="handleFileSelect"
    />
    
    <div 
      :class="[
        'flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer',
        isDragging 
          ? 'border-primary-500 bg-primary-50/50 scale-[0.99]' 
          : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50/50'
      ]"
      @click="fileInput?.click()"
    >
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors', isDragging ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-500']">
        <Upload v-if="!loading" class="h-6 w-6" />
        <Loader2 v-else class="h-6 w-6 animate-spin text-primary-600" />
      </div>
      
      <div class="text-center">
        <p class="text-sm font-bold text-neutral-700">
          {{ loading ? 'Envoi en cours...' : 'Ajoute tes photos' }}
        </p>
        <p class="text-[11px] text-neutral-400 mt-1 font-medium">
          Glisse tes images ici ou clique pour parcourir
        </p>
      </div>
    </div>
  </div>
</template>

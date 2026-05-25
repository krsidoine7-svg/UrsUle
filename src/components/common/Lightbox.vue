<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-vue-next'

const props = defineProps<{
  images: { id: string, signedUrl: string, filename: string }[]
  initialIndex: number
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const currentIndex = ref(props.initialIndex)

const next = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.images.length - 1
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
    @click.self="emit('close')"
  >
    <!-- Header -->
    <div class="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent">
      <div class="flex flex-col">
        <span class="text-white font-bold text-sm">{{ images[currentIndex]?.filename }}</span>
        <span class="text-neutral-400 text-xs">{{ currentIndex + 1 }} / {{ images.length }}</span>
      </div>
      
      <div class="flex items-center gap-4">
        <a 
          :href="images[currentIndex]?.signedUrl" 
          download 
          class="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <Download class="h-5 w-5" />
        </a>
        <button 
          @click="emit('close')"
          class="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:rotate-90"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Main Image -->
    <div class="relative w-full h-full flex items-center justify-center p-4">
      <Transition name="scale" mode="out-in">
        <img 
          :key="images[currentIndex]?.id"
          :src="images[currentIndex]?.signedUrl" 
          :alt="images[currentIndex]?.filename"
          class="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
        />
      </Transition>

      <!-- Navigation -->
      <template v-if="images.length > 1">
        <button 
          @click="prev"
          class="absolute left-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
        >
          <ChevronLeft class="h-8 w-8" />
        </button>
        <button 
          @click="next"
          class="absolute right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
        >
          <ChevronRight class="h-8 w-8" />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

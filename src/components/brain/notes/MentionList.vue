<template>
  <div class="mention-list bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col w-72 text-sm z-[99999] ring-1 ring-black/5">
    <div class="px-3 py-2 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between">
      <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lier à une note</span>
      <span class="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">Entrée ↵</span>
    </div>
    <div class="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
      <template v-if="items.length">
        <button
          v-for="(item, index) in items"
          :key="item.id || index"
          class="mention-item w-full px-3 py-2.5 text-left rounded-lg outline-none transition-all duration-200 flex items-center justify-between group"
          :class="{ 'bg-primary-50 text-primary-900 shadow-sm border border-primary-100': index === selectedIndex, 'hover:bg-neutral-50 border border-transparent': index !== selectedIndex }"
          @click="selectItem(index)"
        >
          <div class="flex flex-col truncate pr-2">
            <span class="font-semibold block truncate text-sm" :class="{ 'text-primary-700': index === selectedIndex }">{{ item.title || item.id }}</span>
            <span v-if="item.folder_id" class="text-xs text-neutral-400 block truncate mt-0.5 group-hover:text-neutral-500 transition-colors">Dans un dossier...</span>
          </div>
          <!-- Indicateur visuel de sélection -->
          <div 
            class="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
            :class="{ 'bg-primary-500 scale-100': index === selectedIndex, 'bg-transparent scale-0': index !== selectedIndex }"
          ></div>
        </button>
      </template>
      <div v-else class="px-4 py-6 text-neutral-400 italic text-center flex flex-col items-center gap-2">
        <span>Aucune note trouvée</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array as () => any[],
    required: true,
  },
  command: {
    type: Function,
    required: true,
  },
})

const selectedIndex = ref(0)

watch(() => props.items, () => {
  selectedIndex.value = 0
})

const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }

  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }

  if (event.key === 'Enter') {
    enterHandler()
    return true
  }

  return false
}

const upHandler = () => {
  selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length
}

const downHandler = () => {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length
}

const enterHandler = () => {
  selectItem(selectedIndex.value)
}

const selectItem = (index: number) => {
  const item = props.items[index]

  if (item) {
    props.command({ id: item.id, label: item.title })
  }
}

// Exposer la méthode onKeyDown pour que le renderer Tiptap puisse l'appeler
defineExpose({
  onKeyDown,
})
</script>

<style scoped>
.mention-list {
  /* scrollbar logic if needed */
}
</style>

<style>
/* Surcharge du thème par défaut de Tippy pour ne pas gâcher notre beau design Glassmorphism */
.tippy-box[data-theme~='ursule-mention'] {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}
.tippy-box[data-theme~='ursule-mention'] > .tippy-content {
  padding: 0 !important;
}
</style>

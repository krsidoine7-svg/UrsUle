<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-vue-next'

const props = defineProps<{
  folderName: string
}>()

const emit = defineEmits(['close', 'confirm'])

const isSubmitting = ref(false)

function handleConfirm() {
  isSubmitting.value = true
  emit('confirm')
}
</script>

<template>
  <div class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
    <div 
      class="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-neutral-100 overflow-hidden transform transition-all flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle class="w-4 h-4" />
          </div>
          <h3 class="text-base font-bold text-neutral-900">Supprimer le dossier</h3>
        </div>
        <button 
          @click="emit('close')" 
          class="p-1.5 hover:bg-neutral-200/60 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <div class="text-sm text-neutral-600 leading-relaxed">
          Êtes-vous sûr de vouloir déplacer le dossier <strong class="text-neutral-950 font-bold">"{{ folderName }}"</strong> dans la corbeille ?
        </div>
        
        <div class="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-4 text-xs font-semibold leading-relaxed flex gap-2">
          <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            Les notes contenues dans ce dossier ne seront <strong class="font-bold">PAS</strong> supprimées. Elles seront conservées dans <strong class="font-bold">"Toutes les notes"</strong>.<br/>
            Les <strong class="font-bold">sous-dossiers</strong> seront également envoyés à la corbeille.
          </div>
        </div>

        <div class="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-3 text-xs font-semibold leading-relaxed flex gap-2">
          <span class="shrink-0">↩️</span>
          Cette action est <strong>réversible</strong> depuis la Corbeille du Cerveau.
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
            type="button" 
            :disabled="isSubmitting"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-md gap-2"
            @click="handleConfirm"
          >
            <Trash2 class="w-4 h-4 text-white" />
            Mettre à la corbeille
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

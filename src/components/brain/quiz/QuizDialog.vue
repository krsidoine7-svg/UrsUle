<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { Task } from '@/types/task.types'
import type { Note } from '@/types/brain.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { Brain, Award, CheckCircle2, Sparkles, HelpCircle, ArrowRight, Loader2, FileText } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isOpen: boolean
  task?: Task | null
  note?: Note | null
}>()

const emit = defineEmits(['close', 'completed'])
const { toast } = useToast()
const router = useRouter()

const userAnswer = ref('')
const isSubmitting = ref(false)
const feedback = ref<{ correct: boolean; message: string } | null>(null)

const questionText = computed(() => {
  if (props.note) {
    return `Cette tâche est reliée à la note "${props.note.title}". Quelle est la principale mise à jour ou conclusion technique que vous en tirez ?`
  }
  return `Pour consolider vos connaissances, résumez en une phrase ce que vous avez appris ou accompli lors de la tâche "${props.task?.title || 'récente'}".`
})

async function submitQuiz() {
  if (!userAnswer.value.trim()) return
  isSubmitting.value = true
  try {
    const isGood = userAnswer.value.trim().length >= 8
    const userRes = await supabase.auth.getUser()
    const userId = userRes.data.user?.id

    if (userId) {
      await supabase.from('note_quizzes').insert({
        user_id: userId,
        note_id: props.note?.id || null,
        task_id: props.task?.id || null,
        trigger: 'task_complete',
        question: questionText.value,
        question_type: 'open',
        is_answered: true,
        user_answer: userAnswer.value.trim(),
        is_correct: isGood,
        answered_at: new Date().toISOString()
      })
    }

    feedback.value = {
      correct: isGood,
      message: isGood 
        ? '🎉 Excellent ! Votre synthèse et votre progression sont sauvegardées dans votre Second Cerveau.' 
        : '💡 Réponse enregistrée ! Chaque réflexion renforce votre ancrage mémoriel.'
    }

    toast({
      title: '🧠 Quiz de validation complété !',
      description: 'Vos connaissances ont été indexées.'
    })

    setTimeout(() => {
      emit('completed', userAnswer.value)
      emit('close')
      userAnswer.value = ''
      feedback.value = null
    }, 1800)
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    isSubmitting.value = false
  }
}

function handleSkip() {
  emit('close')
  userAnswer.value = ''
  feedback.value = null
}

function openLinkedNote() {
  if (props.note) {
    emit('close')
    router.push({ path: '/brain', query: { noteId: props.note.id } })
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-[480px] p-6 rounded-[2.5rem] bg-gradient-to-br from-white via-primary-50/20 to-amber-50/20 border border-primary-100 shadow-2xl overflow-hidden">
      <!-- En-tête avec illustration -->
      <DialogHeader class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Brain class="w-6 h-6 animate-pulse" />
          </div>
          <Badge class="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold px-3 py-1">
            ✨ Ancrage Mémoriel (PKM)
          </Badge>
        </div>
        <DialogTitle class="text-xl font-display font-bold text-neutral-900">
          Validation & Quiz des Connaissances
        </DialogTitle>
        <DialogDescription class="text-xs text-neutral-500 leading-relaxed">
          Prenez 30 secondes pour ancrer ce que vous venez d'accomplir dans votre Second Cerveau.
        </DialogDescription>
      </DialogHeader>

      <!-- Note liée encadrée si présente -->
      <div v-if="note" class="p-3.5 rounded-2xl bg-white border border-primary-200/80 shadow-sm flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="p-2 rounded-xl bg-primary-50 text-primary-600 shrink-0">
            <FileText class="w-4 h-4" />
          </div>
          <div class="overflow-hidden">
            <span class="text-xs font-bold text-neutral-800 truncate block">{{ note.title }}</span>
            <span class="text-[10px] text-neutral-400">Note liée dans UrsUle Brain</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" class="text-[11px] text-primary-600 hover:bg-primary-50 font-bold shrink-0" @click="openLinkedNote">
          Voir la note <ArrowRight class="w-3 h-3 ml-1" />
        </Button>
      </div>

      <!-- Question et Zone de texte -->
      <div class="space-y-4 py-2">
        <div class="p-4 rounded-2xl bg-white/80 border border-neutral-100 shadow-inner">
          <p class="text-xs font-bold text-neutral-800 leading-relaxed flex items-start gap-2">
            <HelpCircle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            {{ questionText }}
          </p>
        </div>

        <textarea 
          v-model="userAnswer"
          rows="3"
          placeholder="Rédigez votre synthèse rapide, vos idées ou leçons apprises..."
          class="w-full text-xs p-3.5 rounded-2xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-800 placeholder:text-neutral-400 transition-all resize-none shadow-sm"
          :disabled="isSubmitting || feedback !== null"
        ></textarea>

        <!-- Feedback de validation -->
        <div v-if="feedback" class="p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200" :class="feedback.correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ feedback.message }}</span>
        </div>
      </div>

      <!-- Actions -->
      <DialogFooter class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-neutral-100">
        <Button 
          variant="ghost" 
          size="sm" 
          class="text-xs text-neutral-400 hover:text-neutral-600 w-full sm:w-auto"
          @click="handleSkip"
          :disabled="isSubmitting"
        >
          Passer pour l'instant
        </Button>

        <Button 
          size="sm" 
          class="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-5 py-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto text-xs"
          :disabled="isSubmitting || !userAnswer.trim() || feedback !== null"
          @click="submitQuiz"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
          <Award v-else class="w-3.5 h-3.5 mr-1.5 text-amber-300" />
          Enregistrer dans le PKM
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

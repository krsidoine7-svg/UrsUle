<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateCalcChallenge, type Challenge } from '@/utils/validation-challenge'
import { Target, AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  task: Task
  isOpen: boolean
}>()

const emit = defineEmits(['success', 'failure', 'cancel'])

const challenge = ref<Challenge | null>(null)
const userAnswer = ref('')
const attempts = ref(0)
const maxAttempts = 3
const isShaking = ref(false)
const isSuccess = ref(false)
const isSubmitting = ref(false)

onMounted(() => {
  if (props.task.validation_type === 'calc') {
    challenge.value = generateCalcChallenge(props.task.priority)
  } else if (props.task.validation_type === 'question') {
    challenge.value = {
      type: 'question',
      question: props.task.validation_question || 'Prouve que tu as fini !',
      answer: props.task.validation_answer || ''
    }
  }
})

const validate = () => {
  if (!challenge.value || isSubmitting.value) return
  
  isSubmitting.value = true
  const isCorrect = challenge.value.type === 'calc'
    ? userAnswer.value.trim() === challenge.value.answer
    : userAnswer.value.toLowerCase().includes(challenge.value.answer.toLowerCase())

  if (isCorrect) {
    isSuccess.value = true
    setTimeout(() => {
      emit('success', props.task.id)
      isSubmitting.value = false
    }, 1000)
  } else {
    attempts.value++
    isShaking.value = true
    setTimeout(() => isShaking.value = false, 500)
    
    if (attempts.value >= maxAttempts) {
      setTimeout(() => {
        emit('failure', props.task.id)
        isSubmitting.value = false
      }, 500)
    } else {
      userAnswer.value = ''
      isSubmitting.value = false
    }
  }
}
</script>

<template>
  <Dialog :open="isOpen">
    <DialogContent class="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-neutral-100 shadow-xl" :class="{ 'animate-shake': isShaking }">
      <!-- Success Overlay -->
      <div v-if="isSuccess" class="absolute inset-0 z-50 bg-green-500 flex flex-col items-center justify-center text-white animate-fade-in">
        <CheckCircle2 class="h-20 w-20 mb-4 animate-bounce-short" />
        <h3 class="text-2xl font-display font-bold">Bravo ! 🎉</h3>
        <p class="opacity-90">Validation réussie</p>
      </div>

      <div class="p-8 space-y-8">
        <DialogHeader class="text-center">
          <div class="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <Target class="h-8 w-8 text-primary-600" />
          </div>
          <DialogTitle class="text-xl font-display font-bold text-neutral-900">
            Prouve que tu as terminé !
          </DialogTitle>
          <DialogDescription class="text-neutral-500 font-medium">
            {{ task.title }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6">
          <div class="text-center">
            <p class="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-2">Le Défi</p>
            <h2 class="text-3xl font-display font-bold text-neutral-800 leading-tight">
              {{ challenge?.question }}
            </h2>
          </div>

          <div class="relative max-w-xs mx-auto">
            <Input 
              v-model="userAnswer"
              :type="challenge?.type === 'calc' ? 'number' : 'text'"
              class="h-16 text-center text-2xl font-bold bg-neutral-50 border-2 border-neutral-100 focus:border-primary-500 focus:ring-primary-500/20 rounded-2xl transition-all"
              placeholder="Ta réponse..."
              @keydown.enter="validate"
              autofocus
            />
          </div>

          <!-- Attempts Counter -->
          <div class="flex justify-center items-center gap-2">
            <div v-for="i in maxAttempts" :key="i" class="flex gap-1">
              <div 
                class="w-3 h-3 rounded-full transition-all duration-300"
                :class="[
                  i <= attempts ? 'bg-red-500 scale-110' : 'bg-neutral-200',
                  i === attempts + 1 ? 'animate-pulse' : ''
                ]"
              ></div>
            </div>
            <span class="text-[10px] font-bold text-neutral-400 uppercase ml-2">
              Tentative {{ attempts }}/{{ maxAttempts }}
            </span>
          </div>
        </div>

        <DialogFooter class="sm:justify-center gap-3">
          <Button 
            variant="ghost" 
            @click="emit('cancel')"
            class="flex-1 h-12 rounded-xl text-neutral-500 font-bold"
          >
            Plus tard
          </Button>
          <Button 
            @click="validate"
            class="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 font-semibold shadow-sm shadow-primary-100"
            :disabled="!userAnswer.trim() || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            Valider
          </Button>
        </DialogFooter>
      </div>

      <!-- Warning Footer on Failure -->
      <div v-if="attempts >= 2" class="bg-amber-50 p-3 flex items-center justify-center gap-2 text-amber-700 text-xs font-bold border-t border-amber-100 animate-slide-up">
        <AlertCircle class="h-4 w-4" />
        Attention : dernier essai avant échec !
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-bounce-short {
  animation: bounceShort 0.6s ease-out;
}

@keyframes bounceShort {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>

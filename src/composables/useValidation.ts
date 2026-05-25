import { ref } from 'vue'
import { useTasksStore } from '@/stores/tasks.store'
import type { Task } from '@/types/task.types'
import { useToast } from '@/components/ui/toast/use-toast'

export function useValidation() {
  const tasksStore = useTasksStore()
  const { toast } = useToast()
  
  const isValidating = ref(false)
  const isAppreciating = ref(false)
  const currentTask = ref<Task | null>(null)

  function startValidation(task: Task) {
    currentTask.value = task
    if (task.validation_type === 'none') {
      isAppreciating.value = true
    } else {
      isValidating.value = true
    }
  }

  async function handleSuccess(taskId: string) {
    isValidating.value = false
    isAppreciating.value = true
    // Le statut 'done' sera mis à jour après l'appréciation ou auto
  }

  async function handleFailure(taskId: string) {
    isValidating.value = false
    try {
      await tasksStore.updateTask(taskId, { 
        status: 'to_redo',
        validation_attempts: 3 // On marque qu'on a échoué
      })
      toast({
        title: 'Tâche non validée',
        description: 'Tu devras reprendre cette tâche plus tard.',
        variant: 'destructive'
      })
    } catch (e: any) {
      console.error(e)
    }
  }

  async function saveAppreciation(appreciation: string) {
    if (!currentTask.value) return
    
    isAppreciating.value = false
    try {
      await tasksStore.updateTask(currentTask.value.id, {
        status: 'done',
        completed_at: new Date().toISOString(),
        appreciation: appreciation as any
      })
      toast({
        title: '✅ Tâche accomplie !',
        description: 'Bravo pour ton travail.'
      })
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: e.message,
        variant: 'destructive'
      })
    } finally {
      currentTask.value = null
    }
  }

  return {
    isValidating,
    isAppreciating,
    currentTask,
    startValidation,
    handleSuccess,
    handleFailure,
    saveAppreciation
  }
}

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TimerWidget from '@/components/common/TimerWidget.vue'
import ValidationModal from '@/components/tasks/ValidationModal.vue'
import AppreciationModal from '@/components/tasks/AppreciationModal.vue'
import FocusMode from '@/components/common/FocusMode.vue'
import { useUIStore } from '@/stores/ui.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useProjectsStore } from '@/stores/projects.store'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { toast } = useToast()

const isAuthPage = computed(() => {
  return ['login', 'register', 'forgot-password'].includes(route.name as string)
})

const showLayout = computed(() => {
  return authStore.isAuthenticated && !isAuthPage.value
})

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const handleValidationSuccess = () => {
  uiStore.finishValidation(true)
}

const handleValidationFailure = async (taskId: string) => {
  uiStore.finishValidation(false)
  await tasksStore.updateTask(taskId, { 
    status: 'to_redo',
    validation_attempts: 3
  })
}

const handleAppreciationSelect = async (appreciation: string) => {
  const taskId = uiStore.taskToValidate?.id
  if (!taskId) return
  
  await tasksStore.updateTask(taskId, {
    status: 'done',
    completed_at: new Date().toISOString(),
    appreciation: appreciation as any
  })
  
  // Notification motivante
  const { getRandomQuote } = await import('@/services/motivational.service')
  const quote = getRandomQuote()
  toast({
    title: 'Bravo ! 🎉',
    description: quote.text,
  })

  uiStore.closeAppreciation()
}

let unsubscribeTasks: (() => void) | null = null
let unsubscribeProjects: (() => void) | null = null

const handleSubscription = (isAuth: boolean) => {
  if (isAuth) {
    if (!unsubscribeTasks) {
      unsubscribeTasks = tasksStore.subscribeToTasks()
    }
    if (!unsubscribeProjects) {
      unsubscribeProjects = projectsStore.subscribeToProjects()
    }
  } else {
    if (unsubscribeTasks) {
      unsubscribeTasks()
      unsubscribeTasks = null
    }
    if (unsubscribeProjects) {
      unsubscribeProjects()
      unsubscribeProjects = null
    }
  }
}

watch(() => authStore.isAuthenticated, (isAuth: boolean) => {
  handleSubscription(isAuth)
}, { immediate: true })

onUnmounted(() => {
  if (unsubscribeTasks) unsubscribeTasks()
  if (unsubscribeProjects) unsubscribeProjects()
})
</script>

<template>
  <div v-if="authStore.loading" class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="flex flex-col items-center gap-4">
      <div class="h-12 w-12 rounded-xl bg-primary-600 animate-pulse flex items-center justify-center shadow-lg shadow-primary-100">
        <span class="text-white text-2xl font-bold font-display">U</span>
      </div>
      <p class="text-neutral-400 font-medium animate-pulse">Chargement de UrsUle...</p>
    </div>
  </div>

  <template v-else>
    <!-- Layout Authentifié -->
    <div v-if="showLayout" class="flex min-h-screen bg-neutral-50 font-body">
      <AppSidebar />
      <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AppHeader />
        <main class="flex-1 overflow-y-auto relative flex flex-col p-4 md:p-8 lg:p-10">
          <router-view v-slot="{ Component }">
            <Transition
              name="fade-slide"
              mode="out-in"
              appear
            >
              <component :is="Component" />
            </Transition>
          </router-view>
        </main>
      </div>
    </div>

    <!-- Layout Minimal (Auth) -->
    <div v-else class="min-h-screen bg-neutral-50 font-body">
      <router-view />
    </div>
  </template>
  <Toaster />
  
  <!-- Global Components (Sheets/Dialogs) -->
  <TaskForm 
    :is-open="uiStore.isTaskFormOpen" 
    :task="uiStore.selectedTaskForEdit"
    @close="uiStore.closeTaskForm"
  />
  <TimerWidget />

  <!-- Global Validation Flow -->
  <ValidationModal 
    v-if="uiStore.isValidating && uiStore.taskToValidate"
    :is-open="uiStore.isValidating"
    :task="uiStore.taskToValidate"
    @success="handleValidationSuccess"
    @failure="handleValidationFailure"
    @cancel="uiStore.finishValidation(false)"
  />

  <AppreciationModal 
    v-if="uiStore.isAppreciating"
    :is-open="uiStore.isAppreciating"
    @select="handleAppreciationSelect"
  />

  <FocusMode 
    v-if="uiStore.isFocusModeOpen"
    :initial-task-id="uiStore.focusTaskId ?? undefined"
    @close="uiStore.closeFocusMode"
  />
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

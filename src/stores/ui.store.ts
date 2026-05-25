import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
  const sidebarMobileOpen = ref(false)
  const activeView = ref<'list' | 'grid' | 'kanban' | 'calendar' | 'graph' | 'database'>(
    (localStorage.getItem('active_view') as any) || 'list'
  )
  
  const isTaskFormOpen = ref(false)
  const selectedTaskForEdit = ref<any>(null)
  
  // Validation Gamifiée
  const isValidating = ref(false)
  const isAppreciating = ref(false)
  const taskToValidate = ref<any>(null)

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebar_collapsed', String(val))
  })

  watch(activeView, (val) => {
    localStorage.setItem('active_view', val)
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleMobileSidebar() {
    sidebarMobileOpen.value = !sidebarMobileOpen.value
  }

  function closeMobileSidebar() {
    sidebarMobileOpen.value = false
  }

  function openTaskForm(task: any = null, defaults: any = null) {
    selectedTaskForEdit.value = task
    isTaskFormOpen.value = true
    // Store defaults if needed
    if (defaults) {
      selectedTaskForEdit.value = { ...defaults, isNew: true }
    }
  }

  function closeTaskForm() {
    isTaskFormOpen.value = false
    selectedTaskForEdit.value = null
  }

  function startValidation(task: any) {
    taskToValidate.value = task
    if (task.validation_type === 'none') {
      isAppreciating.value = true
    } else {
      isValidating.value = true
    }
  }

  function finishValidation(success: boolean) {
    isValidating.value = false
    if (success) {
      isAppreciating.value = true
    } else {
      taskToValidate.value = null
    }
  }

  function closeAppreciation() {
    isAppreciating.value = false
    taskToValidate.value = null
  }

  // Focus Mode
  const isFocusModeOpen = ref(false)
  const focusTaskId = ref<string | null>(null)

  function openFocusMode(taskId: string | null = null) {
    focusTaskId.value = taskId
    isFocusModeOpen.value = true
  }

  function closeFocusMode() {
    isFocusModeOpen.value = false
    focusTaskId.value = null
  }

  return { 
    sidebarCollapsed, 
    sidebarMobileOpen,
    activeView, 
    isTaskFormOpen,
    selectedTaskForEdit,
    isValidating,
    isAppreciating,
    taskToValidate,
    isFocusModeOpen,
    focusTaskId,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    openTaskForm,
    closeTaskForm,
    startValidation,
    finishValidation,
    closeAppreciation,
    openFocusMode,
    closeFocusMode
  }
})

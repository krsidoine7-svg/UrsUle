import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guest: true }
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('@/views/auth/UpdatePasswordView.vue'),
      meta: { requiresAuth: true } // Supabase signs in automatically on recovery link
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/views/ProjectDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/brain',
      component: () => import('@/views/brain/BrainView.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/brain/notes' },
        { path: 'notes', name: 'brain-notes', component: () => import('@/views/brain/NoteListView.vue') },
        { path: 'notes/:id', name: 'brain-note-detail', component: () => import('@/views/brain/NoteEditorView.vue') },
        { path: 'graph', name: 'brain-graph', component: () => import('@/views/brain/GraphView.vue') },
        { path: 'flashcards', name: 'brain-flashcards', component: () => import('@/views/brain/FlashcardsView.vue') },
        { path: 'mindmap', name: 'brain-mindmap', component: () => import('@/views/brain/MindMapView.vue') },
        { path: 'journal', name: 'brain-journal', component: () => import('@/views/brain/JournalView.vue') },
        { path: 'trash', name: 'brain-trash', component: () => import('@/views/brain/BrainTrashView.vue') },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// Guard global
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  
  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router

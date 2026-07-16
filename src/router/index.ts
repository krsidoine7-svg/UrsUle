import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { updateSEOMetadata } from '@/composables/useSEO'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true, title: 'Connexion', description: 'Connectez-vous à votre espace UrsUle et reprenez le contrôle de votre temps et de vos objectifs.' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true, title: 'Inscription', description: "Créez votre compte gratuit sur UrsUle, l'application intelligente d'agenda et de second cerveau." }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guest: true, title: 'Mot de passe oublié', description: 'Récupérez l’accès à votre compte UrsUle en toute sécurité.' }
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('@/views/auth/UpdatePasswordView.vue'),
      meta: { requiresAuth: true, title: 'Nouveau mot de passe', description: 'Mettez à jour votre mot de passe pour sécuriser votre espace.' }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Tableau de bord', description: 'Vue d’ensemble de votre productivité du jour, de vos objectifs prioritaires et de vos habitudes clés.' }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true, title: 'Tâches & Objectifs', description: 'Gérez et priorisez vos tâches quotidiennes avec méthode Kanban, sous-tâches et validation par défis.' }
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAuth: true, title: 'Projets', description: 'Suivez vos projets à long terme, vos timelines et l’avancement automatique de vos étapes clés.' }
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/views/ProjectDetailView.vue'),
      meta: { requiresAuth: true, title: 'Détail du Projet', description: 'Gérez les tâches, documents et jalons spécifiques de votre projet.' }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true, title: 'Agenda', description: 'Visualisez et planifiez vos journées, semaines et échéances dans un calendrier dynamique complet.' }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
      meta: { requiresAuth: true, title: 'Statistiques', description: 'Analysez vos performances de productivité, vos streaks de complétion et vos graphiques d’évolution.' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Paramètres', description: 'Configurez vos préférences d’application, de notifications et synchronisation cloud.' }
    },
    {
      path: '/brain',
      component: () => import('@/views/brain/BrainView.vue'),
      meta: { requiresAuth: true, title: 'Second Cerveau (PKM)', description: 'Explorez vos notes, liens bidirectionnels, cartes mentales et graphe de connaissances.' },
      children: [
        { path: '', redirect: '/brain/notes' },
        { path: 'notes', name: 'brain-notes', component: () => import('@/views/brain/NoteListView.vue'), meta: { title: 'Notes du Brain', description: 'Consultez, organisez et éditez vos notes riches en Markdown / Tiptap.' } },
        { path: 'notes/:id', name: 'brain-note-detail', component: () => import('@/views/brain/NoteEditorView.vue'), meta: { title: 'Éditeur de Note', description: 'Rédigez vos idées et reliez-les à vos projets et tâches.' } },
        { path: 'graph', name: 'brain-graph', component: () => import('@/views/brain/GraphView.vue'), meta: { title: 'Graphe de Connaissances', description: 'Visualisez les connexions interactives entre l’ensemble de vos notes et idées.' } },
        { path: 'flashcards', name: 'brain-flashcards', component: () => import('@/views/brain/FlashcardsView.vue'), meta: { title: 'Flashcards & Mémorisation', description: 'Révisez et mémorisez efficacement vos connaissances grâce aux cartes interactives.' } },
        { path: 'mindmap', name: 'brain-mindmap', component: () => import('@/views/brain/MindMapView.vue'), meta: { title: 'Mind Map', description: 'Organisez visuellement votre arborescence de pensées et de dossiers.' } },
        { path: 'journal', name: 'brain-journal', component: () => import('@/views/brain/JournalView.vue'), meta: { title: 'Journal Quotidien', description: 'Suivez vos réflexions quotidiennes, votre humeur et votre heatmap annuelle.' } },
        { path: 'stats', name: 'brain-stats', component: () => import('@/views/brain/BrainStatsView.vue'), meta: { title: 'Statistiques du Second Cerveau', description: 'Analysez votre assiduité, révisions et graphe de connaissances.' } },
        { path: 'trash', name: 'brain-trash', component: () => import('@/views/brain/BrainTrashView.vue'), meta: { title: 'Corbeille du Brain', description: 'Gérez et restaurez vos notes supprimées.' } },
      ]
    },
    {
      path: '/share/:token',
      name: 'share-note-public',
      component: () => import('@/views/brain/ShareNotePublicView.vue'),
      meta: { title: 'Note Partagée • UrsUle Brain', description: 'Consultez ce document partagé en toute sécurité sur UrsUle Brain.' }
    },
    {
      path: '/share/slug/:slug',
      name: 'share-note-public-slug',
      component: () => import('@/views/brain/ShareNotePublicView.vue'),
      meta: { title: 'Note Partagée • UrsUle Brain', description: 'Consultez ce document partagé en toute sécurité sur UrsUle Brain.' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Page non trouvée', description: 'La page que vous recherchez est introuvable ou a été déplacée.' }
    }
  ]
})

// Guard global d'authentification
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  
  if (to.meta.guest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

// Hook SEO : mise à jour dynamique du Title et des balises Meta après chaque navigation
router.afterEach((to) => {
  updateSEOMetadata(
    {
      title: to.meta.title as string | undefined,
      description: to.meta.description as string | undefined
    },
    to.path
  )
})

export default router

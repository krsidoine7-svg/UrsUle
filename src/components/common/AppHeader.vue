<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useTasksStore } from '@/stores/tasks.store'
import { tasksService } from '@/services/tasks.service'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Bell, Search, Menu, User, Settings, LogOut, ChevronRight, Zap } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects.store'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast/use-toast'

const authStore = useAuthStore()
const uiStore = useUIStore()
const projectsStore = useProjectsStore()
const notificationsStore = useNotificationsStore()
const tasksStore = useTasksStore()
const route = useRoute()
const router = useRouter()
const { toast } = useToast()

const handleNotificationClick = async (notif: any) => {
  try {
    // 1. Marquer la notification comme lue si nécessaire
    if (!notif.is_read) {
      await notificationsStore.markAsRead(notif.id)
    }

    // 2. Action contextuelle selon le type
    if (notif.related_entity_type === 'task' && notif.related_entity_id) {
      // Récupérer la tâche dans le store ou depuis le service
      let task = tasksStore.tasks.find((t: any) => t.id === notif.related_entity_id)
      if (!task) {
        task = await tasksService.getById(notif.related_entity_id)
      }

      if (task) {
        uiStore.openTaskForm(task)
      }

      if (route.path !== '/tasks') {
        await router.push('/tasks')
      }

      toast({
        title: 'Tâche chargée 📝',
        description: `Ouverture de la tâche : "${task?.title || ''}"`
      })
    } else if (notif.related_entity_type === 'project' && notif.related_entity_id) {
      await router.push(`/projects/${notif.related_entity_id}`)
      toast({
        title: 'Projet chargé 📂',
        description: 'Navigation vers le projet correspondant.'
      })
    } else {
      // Bilan du jour ou notification générale : rediriger vers le tableau de bord
      if (route.path !== '/') {
        await router.push('/')
      }
      toast({
        title: notif.title || 'Notification',
        description: notif.message
      })
    }
  } catch (err) {
    console.error('Erreur lors du clic sur la notification:', err)
    // Redirection de secours vers les tâches en cas d'erreur
    if (route.path !== '/tasks') {
      await router.push('/tasks')
    }
  }
}

onMounted(() => {
  notificationsStore.fetchNotifications()
  notificationsStore.subscribeToNotifications()
})

const formatTimeAgo = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr })
}

const breadcrumbs = computed(() => {
  const list = [{ label: 'UrsUle', path: '/' }]
  const name = route.name as string
  
  if (name === 'dashboard') return [{ label: 'Tableau de bord', path: '/' }]
  
  if (name === 'tasks') list.push({ label: 'Mes tâches', path: '/tasks' })
  if (name === 'calendar') list.push({ label: 'Calendrier', path: '/calendar' })
  if (name === 'stats') list.push({ label: 'Statistiques', path: '/stats' })
  if (name === 'settings') list.push({ label: 'Paramètres', path: '/settings' })
  
  if (name === 'projects' || name === 'project-detail') {
    list.push({ label: 'Projets', path: '/projects' })
    if (name === 'project-detail' && route.params.id) {
      const project = projectsStore.projects.find(p => p.id === route.params.id)
      list.push({ label: project?.name || 'Détail', path: route.fullPath })
    }
  }
  
  return list
})

const userInitials = computed(() => {
  if (!authStore.user?.full_name) return 'U'
  return authStore.user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 lg:h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
    <div class="flex items-center gap-2">
      <!-- Hamburger Mobile -->
      <Button 
        variant="ghost" 
        size="icon" 
        class="lg:hidden text-neutral-600 mr-1"
        @click="uiStore.toggleMobileSidebar"
      >
        <Menu class="h-5 w-5" />
      </Button>

      <div v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center gap-2">
        <ChevronRight v-if="index > 0" class="h-4 w-4 text-neutral-300 hidden sm:block" />
        <button 
          @click="router.push(crumb.path)"
          class="text-sm font-bold transition-colors hover:text-primary-600"
          :class="[
            index === breadcrumbs.length - 1 ? 'text-neutral-900' : 'text-neutral-400',
            index > 0 ? 'hidden sm:block' : ''
          ]"
        >
          {{ crumb.label }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <!-- Search (Placeholder) -->
      <div class="hidden md:flex items-center relative group">
        <Search class="absolute left-3 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600" />
        <input 
          type="text" 
          placeholder="Rechercher..." 
          class="bg-neutral-50 border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
        />
      </div>

      <Button 
        variant="outline"
        size="icon"
        class="hidden sm:flex rounded-full border-neutral-200 text-neutral-500 hover:text-primary-600 hover:border-primary-100 hover:bg-primary-50 transition-all group"
        title="Mode Focus Zen"
        @click="uiStore.openFocusMode()"
      >
        <Zap class="h-4 w-4 group-hover:fill-current" />
      </Button>

      <Button 
        class="bg-primary-600 hover:bg-primary-700 gap-2 shadow-sm shadow-primary-200"
        @click="uiStore.openTaskForm()"
      >
        <Plus class="h-4 w-4" />
        <span class="hidden sm:inline">Nouvelle tâche</span>
      </Button>

      <div class="flex items-center gap-2 ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button 
              variant="ghost" 
              size="icon" 
              class="text-neutral-500 relative"
            >
              <Bell class="h-5 w-5" />
              <span v-if="notificationsStore.unreadCount > 0" class="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-80 mt-2 rounded-xl p-0">
            <div class="flex items-center justify-between p-4 border-b border-neutral-100">
              <span class="font-bold">Notifications</span>
              <Button 
                v-if="notificationsStore.unreadCount > 0" 
                variant="ghost" 
                size="sm" 
                class="text-xs h-auto py-1 px-2 text-primary-600 hover:text-primary-700"
                @click="notificationsStore.markAllAsRead()"
              >
                Tout marquer comme lu
              </Button>
            </div>
            <div class="max-h-[300px] overflow-y-auto no-scrollbar">
              <div v-if="notificationsStore.notifications.length === 0" class="p-4 text-center text-sm text-neutral-500">
                Aucune notification pour le moment.
              </div>
              <DropdownMenuItem 
                v-for="notif in notificationsStore.notifications" 
                :key="notif.id"
                as-child
              >
                <div 
                  class="p-4 border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer outline-none select-none"
                  :class="{ 'bg-primary-50/30': !notif.is_read }"
                  @click="handleNotificationClick(notif)"
                >
                  <div class="flex gap-3">
                    <div class="mt-1">
                      <div v-if="notif.type === 'info'" class="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div v-else-if="notif.type === 'success'" class="h-2 w-2 rounded-full bg-green-500"></div>
                      <div v-else-if="notif.type === 'warning'" class="h-2 w-2 rounded-full bg-orange-500"></div>
                      <div v-else-if="notif.type === 'error'" class="h-2 w-2 rounded-full bg-red-500"></div>
                    </div>
                    <div class="flex-1 space-y-1">
                      <p class="text-sm font-medium leading-none text-neutral-900">{{ notif.title }}</p>
                      <p class="text-xs text-neutral-500 mt-1">{{ notif.message }}</p>
                      <p class="text-[10px] text-neutral-400 mt-2">{{ formatTimeAgo(notif.created_at) }}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Avatar class="h-10 w-10 border-2 border-neutral-50 hover:border-primary-100 cursor-pointer transition-all">
              <AvatarImage :src="authStore.user?.avatar_url || ''" />
              <AvatarFallback class="bg-primary-50 text-primary-700 font-bold">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56 mt-2 rounded-xl">
            <DropdownMenuLabel class="font-normal p-4">
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-bold leading-none">{{ authStore.user?.full_name }}</p>
                <p class="text-xs leading-none text-neutral-500">{{ authStore.user?.email }}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem @click="router.push('/settings')" class="cursor-pointer">
                <User class="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/settings')" class="cursor-pointer">
                <Settings class="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="text-red-600 cursor-pointer focus:text-red-600">
              <LogOut class="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import AppLogo from './AppLogo.vue'
import NavItem from './NavItem.vue'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Calendar,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Trash2,
  Brain
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const authStore = useAuthStore()
const uiStore = useUIStore()
const router = useRouter()
const route = useRoute()

const expandedItems = ref<string[]>([])

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Mes tâches', icon: CheckSquare },
  { to: '/projects', label: 'Projets', icon: FolderOpen },
  { to: '/brain', label: 'UrsUle Brain', icon: Brain },
  { to: '/calendar', label: 'Calendrier', icon: Calendar },
  { to: '/stats', label: 'Statistiques', icon: BarChart2 },
]

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}

// Fermer le menu mobile quand on change de page
watch(() => route.path, () => {
  uiStore.closeMobileSidebar()
})

const userInitials = computed(() => {
  if (!authStore.user?.full_name) return 'U'
  return authStore.user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})
</script>

<template>
  <!-- Overlay mobile -->
  <Transition name="fade">
    <div 
      v-if="uiStore.sidebarMobileOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
      @click="uiStore.closeMobileSidebar"
    ></div>
  </Transition>

  <aside 
    :class="[
      'flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out z-40',
      // Desktop
      'hidden lg:flex relative',
      uiStore.sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
    ]"
  >
    <!-- Header -->
    <div class="p-5 flex items-center justify-between overflow-hidden h-20">
      <AppLogo :collapsed="uiStore.sidebarCollapsed" />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 space-y-1 py-4">
      <template v-for="item in navItems" :key="item.to">
        <NavItem 
          :to="item.to"
          :label="item.label"
          :icon="item.icon"
          :collapsed="uiStore.sidebarCollapsed"
        />
      </template>
      
      <div class="py-4">
        <Separator />
      </div>

      <NavItem 
        to="/settings" 
        label="Paramètres" 
        :icon="Settings" 
        :collapsed="uiStore.sidebarCollapsed"
      />
    </nav>

    <!-- User Profile Footer -->
    <div class="p-4 border-t border-neutral-200">
      <div 
        class="flex items-center gap-3 p-2 rounded-sm transition-colors overflow-hidden"
        :class="[!uiStore.sidebarCollapsed ? 'hover:bg-neutral-50' : 'justify-center']"
      >
        <Avatar class="h-9 w-9 shrink-0 border border-neutral-100">
          <AvatarImage :src="authStore.user?.avatar_url || ''" />
          <AvatarFallback class="bg-primary-50 text-primary-700 font-bold">
            {{ userInitials }}
          </AvatarFallback>
        </Avatar>

        <div v-if="!uiStore.sidebarCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-neutral-900 truncate">
            {{ authStore.user?.full_name || 'Utilisateur' }}
          </p>
          <p class="text-xs text-neutral-500 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        class="w-full mt-2 justify-start gap-3 px-3 text-neutral-500 hover:text-red-600 hover:bg-red-50"
        @click="handleLogout"
      >
        <LogOut class="h-5 w-5" />
        <span v-if="!uiStore.sidebarCollapsed" class="text-sm font-medium">Déconnexion</span>
      </Button>
    </div>

    <!-- Toggle Button (Desktop) -->
    <Button 
      variant="outline" 
      size="icon" 
      class="absolute -right-3 top-10 h-6 w-6 rounded-sm bg-white shadow-md border-neutral-200"
      @click="uiStore.toggleSidebar"
    >
      <ChevronLeft v-if="!uiStore.sidebarCollapsed" class="h-3 w-3" />
      <ChevronRight v-else class="h-3 w-3" />
    </Button>
  </aside>

  <!-- Mobile Overlay Backdrop -->
  <Transition name="fade">
    <div 
      v-if="uiStore.sidebarMobileOpen" 
      @click="uiStore.closeMobileSidebar()" 
      class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 lg:hidden transition-opacity cursor-pointer"
    ></div>
  </Transition>

  <!-- Mobile Sidebar (Drawer) -->
  <Transition name="slide">
    <aside 
      v-if="uiStore.sidebarMobileOpen"
      class="fixed inset-y-0 left-0 w-72 flex flex-col bg-white border-r border-neutral-200 z-[60] lg:hidden shadow-2xl"
    >
      <!-- Mobile Header -->
      <div class="p-5 flex items-center justify-between h-20">
        <AppLogo :collapsed="false" />
        <Button variant="ghost" size="icon" class="text-neutral-400" @click="uiStore.closeMobileSidebar">
          <X class="h-5 w-5" />
        </Button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 space-y-1 py-4 overflow-y-auto">
        <NavItem 
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :label="item.label"
          :icon="item.icon"
          :collapsed="false"
          @click="uiStore.closeMobileSidebar()"
        />
        
        <div class="py-4">
          <Separator />
        </div>

        <NavItem 
          to="/settings" 
          label="Paramètres" 
          :icon="Settings" 
          :collapsed="false"
        />
      </nav>

      <!-- User Profile Footer -->
      <div class="p-4 border-t border-neutral-200">
        <div class="flex items-center gap-3 p-2 rounded-lg">
          <Avatar class="h-9 w-9 shrink-0 border border-neutral-100">
            <AvatarImage :src="authStore.user?.avatar_url || ''" />
            <AvatarFallback class="bg-primary-50 text-primary-700 font-bold">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-neutral-900 truncate">
              {{ authStore.user?.full_name || 'Utilisateur' }}
            </p>
            <p class="text-xs text-neutral-500 truncate">
              {{ authStore.user?.email }}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          class="w-full mt-2 justify-start gap-3 px-3 text-neutral-500 hover:text-red-600 hover:bg-red-50"
          @click="handleLogout"
        >
          <LogOut class="h-5 w-5" />
          <span class="text-sm font-medium">Déconnexion</span>
        </Button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 100px;
  opacity: 1;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects.store'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Filter,
  Rocket,
  CheckCircle2,
  Clock,
  Archive,
  Loader2
} from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth.store'
import { watch } from 'vue'

const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const isFormOpen = ref(false)
const searchQuery = ref('')
const activeFilter = ref<'all' | 'active' | 'completed' | 'paused' | 'archived'>('all')

onMounted(() => {
  if (authStore.user) {
    const isSilent = projectsStore.projects.length > 0
    projectsStore.fetchProjects(isSilent)
  }
})

const filteredProjects = computed(() => {
  return projectsStore.projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = activeFilter.value === 'all' || p.status === activeFilter.value
    
    return matchesSearch && matchesStatus
  })
})

const stats = computed(() => projectsStore.projectsStats)
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-3xl font-display font-black text-neutral-900 tracking-tight">Mes Projets</h1>
        <p class="text-neutral-500 font-medium">Gère tes grandes aventures et suis tes progrès.</p>
      </div>
      <Button 
        @click="isFormOpen = true"
        class="bg-primary-600 hover:bg-primary-700 text-white h-12 px-6 rounded-2xl shadow-xl shadow-primary-100 font-bold transition-all hover:scale-105 active:scale-95"
      >
        <Plus class="h-5 w-5 mr-2" />
        Nouveau Projet
      </Button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Rocket class="h-5 w-5 text-primary-600" />
        </div>
        <span class="text-2xl font-display font-bold text-neutral-900">{{ stats.active }}</span>
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Actifs</span>
      </div>
      <div class="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
          <CheckCircle2 class="h-5 w-5 text-green-600" />
        </div>
        <span class="text-2xl font-display font-bold text-neutral-900">{{ stats.completed }}</span>
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Terminés</span>
      </div>
      <div class="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Clock class="h-5 w-5 text-amber-600" />
        </div>
        <span class="text-2xl font-display font-bold text-neutral-900">{{ stats.paused }}</span>
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">En pause</span>
      </div>
      <div class="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
        <div class="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center">
          <Archive class="h-5 w-5 text-neutral-400" />
        </div>
        <span class="text-2xl font-display font-bold text-neutral-900">{{ stats.total }}</span>
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total</span>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
      <div class="flex items-center gap-2 p-1 bg-neutral-50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
        <button 
          v-for="filter in ['all', 'active', 'completed', 'paused', 'archived']" 
          :key="filter"
          @click="activeFilter = filter as any"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
          :class="[activeFilter === filter ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
        >
          {{ filter === 'all' ? 'Tous' : filter.charAt(0).toUpperCase() + filter.slice(1) }}
        </button>
      </div>

      <div class="relative w-full md:w-80">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input 
          v-model="searchQuery"
          placeholder="Rechercher un projet..." 
          class="pl-10 h-12 bg-neutral-50 border-none rounded-2xl focus-visible:ring-primary-500/20"
        />
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-if="projectsStore.loading && projectsStore.projects.length === 0" class="flex items-center justify-center py-20">
      <Loader2 class="h-10 w-10 text-primary-600 animate-spin" />
    </div>

    <div v-else-if="filteredProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard 
        v-for="project in filteredProjects" 
        :key="project.id" 
        :project="project" 
      />
    </div>

    <div v-else class="text-center py-32 bg-white rounded-[40px] border border-dashed border-neutral-200">
      <div class="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <FolderOpen class="h-10 w-10 text-neutral-200" />
      </div>
      <h3 class="text-xl font-display font-bold text-neutral-800 mb-2">Aucun projet trouvé</h3>
      <p class="text-neutral-400 mb-8 max-w-xs mx-auto">Commence par créer ton premier projet pour organiser ton travail.</p>
      <Button @click="isFormOpen = true" variant="outline" class="rounded-xl font-bold">
        Créer un projet
      </Button>
    </div>

    <ProjectForm 
      :is-open="isFormOpen" 
      @close="isFormOpen = false" 
    />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

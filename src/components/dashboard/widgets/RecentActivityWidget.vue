<template>
  <div class="bg-white rounded-[1.25rem] border border-neutral-100 p-10 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col group/activity">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h3 class="text-2xl font-display font-black text-neutral-900 leading-tight">Activité</h3>
        <p class="text-sm text-neutral-400 font-medium">Le flux de ton productivité</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover/activity:text-primary-500 transition-colors">
        <Activity class="h-6 w-6" />
      </div>
    </div>

    <div class="relative flex-1 space-y-10 before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary-50 before:via-neutral-50 before:to-transparent">
      <div 
        v-for="activity in activities" 
        :key="activity.id"
        @click="goToTask(activity.taskId)"
        class="relative flex items-start gap-8 group cursor-pointer"
      >
        <!-- Icon Container with Pulse effect on hover -->
        <div 
          class="relative flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 z-10 transition-all duration-500 group-hover:scale-110 shadow-sm"
          :class="activity.color"
        >
          <component :is="activity.icon" class="h-6 w-6" />
          <div class="absolute inset-0 rounded-2xl bg-current opacity-0 group-hover:animate-ping-slow"></div>
        </div>
        
        <div class="flex-1 min-w-0 pt-1.5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
            <h4 class="text-base font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">{{ activity.title }}</h4>
            <span class="text-[10px] font-black text-neutral-400 lowercase tracking-[0.2em] whitespace-nowrap bg-neutral-50 px-2 py-0.5 rounded-full">
              {{ formatActivityDate(activity.date) }}
            </span>
          </div>
          <p class="text-sm text-neutral-500 font-medium line-clamp-1 leading-relaxed">
            {{ activity.description }}
          </p>
        </div>
      </div>

      <div v-if="activities.length === 0" class="flex flex-col items-center justify-center py-16 text-center opacity-40">
        <div class="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
          <History class="h-10 w-10 text-neutral-200" />
        </div>
        <h4 class="text-sm font-black uppercase tracking-widest text-neutral-400">Silence radio</h4>
        <p class="text-[10px] font-medium mt-2">Commence à travailler pour voir ton activité ici</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, CheckCircle2, MessageSquare, Activity, History } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  tasks: Task[]
  timeSessions?: any[]
}>()

const router = useRouter()

const isValidDate = (d: any) => {
  if (!d) return false
  const date = new Date(d)
  return !isNaN(date.getTime())
}

const formatActivityDate = (date: Date) => {
  try {
    return formatDistanceToNow(date, { locale: fr, addSuffix: true })
  } catch (e) {
    console.error('Error formatting activity date:', e)
    return 'récemment'
  }
}

const activities = computed(() => {
  const list: any[] = []
  
  props.tasks.forEach(task => {
    // Action Création
    if (isValidDate(task.created_at)) {
      list.push({
        id: `create-${task.id}`,
        taskId: task.id,
        type: 'create',
        title: 'Nouvelle tâche',
        description: task.title,
        date: new Date(task.created_at),
        icon: Plus,
        color: 'bg-blue-50 text-blue-600'
      })
    }
    
    // Action Complétion
    if (task.completed_at && isValidDate(task.completed_at)) {
      list.push({
        id: `complete-${task.id}`,
        taskId: task.id,
        type: 'complete',
        title: 'Mission accomplie',
        description: task.title,
        date: new Date(task.completed_at),
        icon: CheckCircle2,
        color: 'bg-emerald-50 text-emerald-600'
      })
    }
    
    // Commentaires
    if (task.comments) {
      task.comments.forEach((comment: any) => {
        if (isValidDate(comment.created_at)) {
          list.push({
            id: `comment-${comment.id}`,
            taskId: task.id,
            type: 'comment',
            title: 'Nouvelle note',
            description: comment.content,
            date: new Date(comment.created_at),
            icon: MessageSquare,
            color: 'bg-amber-50 text-amber-600'
          })
        }
      })
    }
  })

  // Time Sessions
  if (props.timeSessions) {
    props.timeSessions.forEach(session => {
      if (isValidDate(session.started_at)) {
        list.push({
          id: `session-${session.id}`,
          taskId: session.task_id,
          type: 'session',
          title: 'Session de focus',
          description: `${session.task?.title || 'Travail'} • ${session.duration_minutes} min`,
          date: new Date(session.started_at),
          icon: Activity,
          color: 'bg-purple-50 text-purple-600'
        })
      }
    })
  }

  return list
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
})

const goToTask = (taskId: string) => {
  if (!taskId) return
  router.push({ path: '/tasks', query: { taskId } })
}
</script>

<style scoped>
@keyframes ping-slow {
  0% { transform: scale(1); opacity: 0.2; }
  100% { transform: scale(1.5); opacity: 0; }
}
.group-hover\:animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>

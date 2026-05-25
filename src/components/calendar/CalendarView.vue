<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import frLocale from '@fullcalendar/core/locales/fr'
import { useTasksStore } from '@/stores/tasks.store'
import { useUIStore } from '@/stores/ui.store'
import type { Task } from '@/types/task.types'
import { format } from 'date-fns'

const tasksStore = useTasksStore()
const uiStore = useUIStore()

const priorityColors: Record<string, string> = {
  low: '#94A3B8',
  normal: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444'
}

const events = computed(() => {
  return tasksStore.tasks
    .filter(t => t.deadline)
    .map(task => ({
      id: task.id,
      title: task.title,
      start: task.deadline,
      end: task.deadline,
      backgroundColor: priorityColors[task.priority],
      borderColor: priorityColors[task.priority],
      textColor: '#ffffff',
      extendedProps: { task }
    }))
})

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: frLocale,
  timeZone: 'Africa/Abidjan',
  headerToolbar: {
    left: 'prev,today,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  height: 'calc(100vh - 280px)',
  editable: true,
  selectable: true,
  events: events.value,
  
  eventClick: (info: any) => {
    const task = info.event.extendedProps.task
    emit('open-detail', task)
  },

  eventDrop: async (info: any) => {
    const taskId = info.event.id
    const newDeadline = info.event.start?.toISOString()
    if (newDeadline) {
      try {
        await tasksStore.updateTask(taskId, { deadline: newDeadline })
      } catch (e) {
        info.revert()
      }
    }
  },

  dateClick: (info: any) => {
    uiStore.openTaskForm({ deadline: info.dateStr })
  },

  // Sync events manually since computed might not reactive update FC internal state well without this
  eventSources: [
    {
      events: (info: any, successCallback: any) => {
        successCallback(events.value)
      }
    }
  ]
}

const emit = defineEmits<{
  (e: 'open-detail', task: Task): void
}>()

const renderCalendar = ref(true)

onBeforeUnmount(() => {
  renderCalendar.value = false
})
</script>

<template>
  <div class="calendar-container bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-neutral-100 shadow-sm animate-fade-in">
    <div class="calendar-wrapper overflow-x-auto no-scrollbar">
      <div class="min-w-[700px] md:min-w-0">
        <FullCalendar v-if="renderCalendar" :options="calendarOptions" />
      </div>
    </div>
  </div>
</template>

<style>
/* Custom FullCalendar Styles to match UrsUle UI */
:root {
  --fc-button-bg-color: #ffffff;
  --fc-button-border-color: #f1f5f9;
  --fc-button-text-color: #64748b;
  --fc-button-hover-bg-color: #f8fafc;
  --fc-button-hover-border-color: #e2e8f0;
  --fc-button-active-bg-color: #3b82f6;
  --fc-button-active-border-color: #3b82f6;
  --fc-event-border-radius: 8px;
  --fc-border-color: #f1f5f9;
}

.fc .fc-toolbar-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  color: #1e293b;
  font-size: 1.5rem;
}

.fc .fc-button {
  border-radius: 12px;
  font-weight: 700;
  text-transform: capitalize;
  padding: 8px 16px;
  transition: all 0.2s;
  box-shadow: none !important;
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  background-color: #3b82f6;
  color: #ffffff;
}

.fc-theme-standard td, .fc-theme-standard th {
  border-color: #f1f5f9;
}

.fc-day-today {
  background-color: #eff6ff !important;
}

.fc-event {
  cursor: pointer;
  padding: 2px 4px;
  font-weight: 600;
  font-size: 0.8rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border: none !important;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.no-scrollbar::-webkit-scrollbar { display: none; }

/* Responsive styles for FullCalendar */
@media (max-width: 768px) {
  .fc .fc-toolbar {
    flex-direction: column;
    gap: 12px;
  }
  
  .fc .fc-toolbar-chunk {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .fc .fc-toolbar-title {
    font-size: 1.25rem;
  }

  .fc .fc-button {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}
</style>

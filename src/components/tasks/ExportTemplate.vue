<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  tasks: Task[]
  filters?: any
}>()

const dateStr = format(new Date(), 'PPP', { locale: fr })
</script>

<template>
  <div id="pdf-export-content" class="p-12 bg-white text-neutral-900 w-[800px]">
    <!-- Header -->
    <div class="flex justify-between items-center border-b-4 border-blue-500 pb-10 mb-10">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-display font-black text-3xl shadow-lg shadow-blue-100">
          U
        </div>
        <div>
          <h1 class="text-4xl font-display font-black tracking-tighter text-neutral-900 leading-none">UrsUle</h1>
          <p class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Productivité</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Date du rapport</p>
        <p class="text-xl font-display font-black text-neutral-900">{{ dateStr }}</p>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-4 gap-4 mb-10">
      <div class="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
        <p class="text-[10px] font-black text-neutral-400 uppercase mb-1">Total</p>
        <p class="text-xl font-display font-black">{{ tasks.length }}</p>
      </div>
      <div class="bg-green-50 p-4 rounded-2xl border border-green-100">
        <p class="text-[10px] font-black text-green-600 uppercase mb-1">Terminées</p>
        <p class="text-xl font-display font-black text-green-700">
          {{ tasks.filter(t => t.status === 'done').length }}
        </p>
      </div>
      <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <p class="text-[10px] font-black text-blue-600 uppercase mb-1">À faire</p>
        <p class="text-xl font-display font-black text-blue-700">
          {{ tasks.filter(t => t.status === 'todo').length }}
        </p>
      </div>
      <div class="bg-primary-50 p-4 rounded-2xl border border-primary-100">
        <p class="text-[10px] font-black text-primary-600 uppercase mb-1">Progression</p>
        <p class="text-xl font-display font-black text-primary-700">
          {{ tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0 }}%
        </p>
      </div>
    </div>

    <!-- Table -->
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-neutral-100">
          <th class="py-4 text-[10px] font-black text-neutral-400 uppercase">Titre</th>
          <th class="py-4 text-[10px] font-black text-neutral-400 uppercase">Priorité</th>
          <th class="py-4 text-[10px] font-black text-neutral-400 uppercase">Statut</th>
          <th class="py-4 text-[10px] font-black text-neutral-400 uppercase">Échéance</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-neutral-50">
        <tr v-for="task in tasks" :key="task.id">
          <td class="py-4">
            <p class="text-sm font-bold text-neutral-900">{{ task.title }}</p>
            <p class="text-[10px] text-neutral-400 font-medium">{{ (task as any).categories?.name || 'Sans catégorie' }}</p>
          </td>
          <td class="py-4">
            <span 
              class="text-[10px] font-black uppercase px-2 py-1 rounded-full"
              :class="{
                'bg-red-50 text-red-600': task.priority === 'urgent',
                'bg-orange-50 text-orange-600': task.priority === 'high',
                'bg-blue-50 text-blue-600': task.priority === 'normal',
                'bg-neutral-50 text-neutral-500': task.priority === 'low'
              }"
            >
              {{ task.priority }}
            </span>
          </td>
          <td class="py-4">
            <span class="text-xs font-bold text-neutral-700">{{ task.status }}</span>
          </td>
          <td class="py-4">
            <p class="text-xs font-bold text-neutral-900">
              {{ task.deadline ? format(new Date(task.deadline), 'dd MMM yyyy', { locale: fr }) : '-' }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Footer -->
    <div class="mt-12 pt-8 border-t border-neutral-100 text-center">
      <p class="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">Généré par UrsUle — ursule.vercel.app</p>
    </div>
  </div>
</template>

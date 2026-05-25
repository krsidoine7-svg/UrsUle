<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps<{
  to: string
  icon: any
  label: string
  collapsed?: boolean
}>()

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <Tooltip :disabled="!collapsed">
      <TooltipTrigger as-child>
        <router-link
          :to="to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group relative"
          :class="[
            isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
          ]"
        >
          <component 
            :is="icon" 
            class="h-5 w-5 shrink-0" 
            :class="[isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600']"
          />
          
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 -translate-x-2"
            enter-to-class="opacity-100 translate-x-0"
          >
            <span v-if="!collapsed" class="text-sm font-medium whitespace-nowrap">
              {{ label }}
            </span>
          </Transition>

          <!-- Active Indicator -->
          <div 
            v-if="isActive" 
            class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary-600 rounded-r-full"
          ></div>
        </router-link>
      </TooltipTrigger>
      <TooltipContent side="right" class="font-medium">
        {{ label }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import {
  DateFormatter,
  getLocalTimeZone,
} from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue: DateRange
}>()

const emits = defineEmits(['update:modelValue'])

const df = new DateFormatter('fr-FR', {
  dateStyle: 'medium',
})

const value = computed({
  get: () => props.modelValue,
  set: (val) => emits('update:modelValue', val),
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :id="'date-range-picker'"
        :class="cn(
          'w-[300px] justify-start text-left font-bold rounded-xl border-neutral-200 h-11 px-4 hover:bg-neutral-50 transition-all',
          !value && 'text-muted-foreground',
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4 text-primary-600" />
        <template v-if="value.start">
          <template v-if="value.end">
            {{ df.format(value.start.toDate(getLocalTimeZone())) }} - {{ df.format(value.end.toDate(getLocalTimeZone())) }}
          </template>
          <template v-else>
            {{ df.format(value.start.toDate(getLocalTimeZone())) }}
          </template>
        </template>
        <template v-else>
          Choisir une période
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 rounded-3xl border-neutral-100 shadow-2xl overflow-hidden" align="end">
      <div class="bg-white">
        <RangeCalendar
          v-model="value"
          :number-of-months="2"
          initial-focus
          :class="cn('p-4')"
        />
      </div>
    </PopoverContent>
  </Popover>
</template>

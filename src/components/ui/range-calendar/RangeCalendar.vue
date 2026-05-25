<script lang="ts" setup>
import { ref, computed, type Ref } from 'vue'
import type { RangeCalendarRootEmits, RangeCalendarRootProps, DateValue } from "reka-ui"
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { RangeCalendarRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev } from "."

const props = defineProps<RangeCalendarRootProps & { class?: HTMLAttributes["class"] }>()

const emits = defineEmits<RangeCalendarRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "placeholder")

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const placeholder = ref(props.modelValue?.start || props.placeholder || today(getLocalTimeZone())) as Ref<DateValue>

const monthsList = [
  { label: "janvier", value: 1 },
  { label: "février", value: 2 },
  { label: "mars", value: 3 },
  { label: "avril", value: 4 },
  { label: "mai", value: 5 },
  { label: "juin", value: 6 },
  { label: "juillet", value: 7 },
  { label: "août", value: 8 },
  { label: "septembre", value: 9 },
  { label: "octobre", value: 10 },
  { label: "novembre", value: 11 },
  { label: "décembre", value: 12 },
]

const yearsList = Array.from({ length: 11 }, (_, i) => today(getLocalTimeZone()).year - 5 + i)

function handleMonthChange(val: any) {
  if (!val) return
  placeholder.value = new CalendarDate(placeholder.value.year, parseInt(val), 1)
}

function handleYearChange(val: any) {
  if (!val) return
  placeholder.value = new CalendarDate(parseInt(val), placeholder.value.month, 1)
}
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    v-model:placeholder="placeholder"
    :class="cn('p-6 bg-white rounded-[2.5rem] shadow-none border-none', props.class)"
    v-bind="forwarded"
  >
    <RangeCalendarHeader class="flex items-center justify-between mb-8 px-2">
      <RangeCalendarPrev class="hover:bg-neutral-50 rounded-2xl border-none shadow-none" />
      
      <div class="flex items-center gap-2">
        <Select :model-value="placeholder.month.toString()" @update:model-value="handleMonthChange">
          <SelectTrigger class="h-9 px-3 border-none bg-neutral-50 rounded-xl font-bold text-xs hover:bg-neutral-100 transition-colors shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="rounded-2xl border-neutral-100 shadow-2xl">
            <SelectItem v-for="m in monthsList" :key="m.value" :value="m.value.toString()" class="rounded-xl lowercase font-bold">
              {{ m.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="placeholder.year.toString()" @update:model-value="handleYearChange">
          <SelectTrigger class="h-9 px-3 border-none bg-neutral-50 rounded-xl font-bold text-xs hover:bg-neutral-100 transition-colors shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="rounded-2xl border-neutral-100 shadow-2xl">
            <SelectItem v-for="y in yearsList" :key="y" :value="y.toString()" class="rounded-xl font-bold">
              {{ y }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <RangeCalendarNext class="hover:bg-neutral-50 rounded-2xl border-none shadow-none" />
    </RangeCalendarHeader>

    <div class="flex flex-col gap-y-8 sm:flex-row sm:gap-x-12 sm:gap-y-0">
      <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="flex mb-4">
            <RangeCalendarHeadCell
              v-for="day in weekDays" :key="day"
              class="w-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center"
            >
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="flex w-full mb-1">
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <RangeCalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>

<script lang="ts" setup>
import type { RangeCalendarCellTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { RangeCalendarCellTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from '@/components/ui/button'

const props = defineProps<RangeCalendarCellTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarCellTrigger
    :class="cn(
      buttonVariants({ variant: 'ghost' }),
      'h-10 w-10 p-0 font-bold rounded-2xl data-[selected]:opacity-100 transition-all',
      '[&[data-today]:not([data-selected])]:bg-neutral-50 [&[data-today]:not([data-selected])]:text-neutral-900',
      // Selection Start
      'data-[selection-start]:bg-neutral-900 data-[selection-start]:text-white data-[selection-start]:hover:bg-neutral-900 data-[selection-start]:hover:text-white data-[selection-start]:focus:bg-neutral-900 data-[selection-start]:focus:text-white data-[selection-start]:rounded-2xl',
      // Selection End
      'data-[selection-end]:bg-neutral-900 data-[selection-end]:text-white data-[selection-end]:hover:bg-neutral-900 data-[selection-end]:hover:text-white data-[selection-end]:focus:bg-neutral-900 data-[selection-end]:focus:text-white data-[selection-end]:rounded-2xl',
      // Outside months
      'data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 [&[data-outside-view][data-selected]]:bg-accent/50 [&[data-outside-view][data-selected]]:text-muted-foreground [&[data-outside-view][data-selected]]:opacity-30',
      // Disabled
      'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
      // Unavailable
      'data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot />
  </RangeCalendarCellTrigger>
</template>

<script lang="ts" setup>
import type { RangeCalendarNextProps } from "reka-ui"
import { ChevronRight } from "lucide-vue-next"
import { reactiveOmit } from "@vueuse/core"
import { RangeCalendarNext, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { HTMLAttributes } from "vue"

const props = defineProps<RangeCalendarNextProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarNext
    :class="cn(
      buttonVariants({ variant: 'ghost' }),
      'h-10 w-10 p-0 opacity-100 hover:bg-neutral-50',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot>
      <ChevronRight class="h-4 w-4" />
    </slot>
  </RangeCalendarNext>
</template>

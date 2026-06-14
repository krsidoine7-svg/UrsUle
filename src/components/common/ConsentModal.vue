<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const isOpen = ref(false)

onMounted(() => {
  const hasConsented = localStorage.getItem('ursule_rgpd_consent')
  if (!hasConsented) {
    isOpen.value = true
  }
})

const accept = () => {
  localStorage.setItem('ursule_rgpd_consent', 'true')
  isOpen.value = false
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => { if (val) isOpen = true }">
    <DialogContent class="sm:max-w-[450px]" :hide-close="true">
      <DialogHeader>
        <DialogTitle class="text-xl">Protection de vos données 🛡️</DialogTitle>
        <DialogDescription class="pt-4 text-base text-neutral-600 dark:text-neutral-300">
          Bienvenue sur UrsUle ! Conformément à la réglementation (RGPD), nous vous informons de l'utilisation de vos données :
          <br><br>
          <ul class="list-disc pl-5 space-y-2 text-left">
            <li>Vos tâches, notes et humeurs sont stockées de manière strictement privée et sécurisée.</li>
            <li>Vos données vous appartiennent : vous pouvez les exporter ou supprimer votre compte à tout moment.</li>
            <li>Des statistiques de productivité sont calculées pour votre usage exclusif.</li>
          </ul>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="sm:justify-end mt-6">
        <Button @click="accept" class="w-full sm:w-auto font-semibold">
          J'ai compris et j'accepte
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

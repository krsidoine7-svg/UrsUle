<script setup lang="ts">
import { Rocket, CheckCircle2, ShieldCheck, Zap } from 'lucide-vue-next'
</script>

<template>
  <main class="relative overflow-hidden">
    <!-- Hero Section -->
    <div class="relative pt-16 pb-32 sm:pt-24 sm:pb-40">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <div class="flex justify-center mb-8">
            <div class="bg-forest/10 p-3 rounded-2xl">
              <Rocket class="w-12 h-12 text-forest" />
            </div>
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            UrsUle
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-600">
            Le gestionnaire d'agenda intelligent pour les jeunes entrepreneurs. Simple comme un jeu d'enfant, rigoureux comme une multinationale.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <a href="#" class="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-forest/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest transition-all">
              Commencer l'aventure
            </a>
            <a href="#" class="text-sm font-semibold leading-6 text-slate-900">
              En savoir plus <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Grid -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
      <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div class="flex flex-col items-start bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div class="rounded-xl bg-blue-50 p-2 mb-4">
            <CheckCircle2 class="h-6 w-6 text-blue-600" />
          </div>
          <dt class="font-bold text-slate-900">Validation Gamifiée</dt>
          <dd class="mt-2 leading-7 text-slate-600">
            Prouve que tu as fait le travail avec nos mini-défis intelligents. Pas de validation, pas de repos !
          </dd>
        </div>
        <div class="flex flex-col items-start bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div class="rounded-xl bg-yellow-50 p-2 mb-4">
            <Zap class="h-6 w-6 text-yellow-600" />
          </div>
          <dt class="font-bold text-slate-900">Focus Chronométré</dt>
          <dd class="mt-2 leading-7 text-slate-600">
            Gère ton temps avec précision. Chaque minute compte pour ton succès futur.
          </dd>
        </div>
        <div class="flex flex-col items-start bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div class="rounded-xl bg-forest/10 p-2 mb-4">
            <ShieldCheck class="h-6 w-6 text-forest" />
          </div>
          <dt class="font-bold text-slate-900">Rigueur Africaine</dt>
          <dd class="mt-2 leading-7 text-slate-600">
            Adapté aux réalités des entrepreneurs locaux. Heure locale, flux de travail et motivation.
          </dd>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.text-forest {
  color: var(--color-forest);
}
.bg-forest {
  background-color: var(--color-forest);
}
</style>

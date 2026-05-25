<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Webhook, Save, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/use-toast'
import { webhookService, type WebhookLog } from '@/services/webhook.service'

const { toast } = useToast()

const activeTab = ref('automation')
const webhookUrl = ref('')
const isTesting = ref(false)
const logs = ref<WebhookLog[]>([])

onMounted(() => {
  webhookUrl.value = webhookService.getGlobalWebhookUrl()
  updateLogs()
  window.addEventListener('webhook-logs-updated', updateLogs)
})

onUnmounted(() => {
  window.removeEventListener('webhook-logs-updated', updateLogs)
})

async function updateLogs() {
  logs.value = await webhookService.getLogs()
}

function saveSettings() {
  if (webhookUrl.value && !webhookService.isValidWebhookUrl(webhookUrl.value)) {
    toast({ title: 'URL invalide', description: 'L\'URL doit commencer par https://', variant: 'destructive' })
    return
  }
  webhookService.setGlobalWebhookUrl(webhookUrl.value)
  toast({ title: 'Paramètres sauvegardés' })
}

async function testWebhook() {
  if (!webhookUrl.value) {
    toast({ title: 'URL manquante', description: 'Veuillez saisir une URL avant de tester.', variant: 'destructive' })
    return
  }
  
  if (!webhookService.isValidWebhookUrl(webhookUrl.value)) {
    toast({ title: 'URL invalide', description: 'L\'URL doit commencer par https://', variant: 'destructive' })
    return
  }

  isTesting.value = true
  try {
    await webhookService.triggerWebhook({ title: 'Test Webhook UrsUle' }, 'test', webhookUrl.value)
    toast({ title: 'Test réussi ! 🎉' })
  } catch (e: any) {
    toast({ title: 'Test échoué', description: e.message, variant: 'destructive' })
  } finally {
    isTesting.value = false
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-8 font-body h-full overflow-y-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-display font-black text-neutral-900">Paramètres</h1>
      <p class="text-neutral-500 font-medium">Gère les configurations de ton espace UrsUle.</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-neutral-200 mb-8">
      <button 
        class="px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2"
        :class="activeTab === 'automation' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'"
        @click="activeTab = 'automation'"
      >
        <Webhook class="h-4 w-4" /> Automatisation
      </button>
    </div>

    <!-- Automatisation Content -->
    <div v-if="activeTab === 'automation'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      <!-- Configuration Box -->
      <div class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 class="text-xl font-display font-bold text-neutral-900 mb-1 flex items-center gap-2">
          <RefreshCw class="h-5 w-5 text-primary-500" /> Webhooks
        </h2>
        <p class="text-sm text-neutral-500 mb-6">Connecte UrsUle à Make, Zapier ou n8n en recevant des événements en temps réel.</p>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-bold text-neutral-700">URL du Webhook Global</label>
            <div class="flex flex-col gap-3">
              <Input 
                v-model="webhookUrl" 
                placeholder="https://hook.make.com/..." 
                class="w-full bg-neutral-50 h-12"
              />
              <Button 
                variant="outline" 
                class="h-12 px-6 font-bold w-full sm:w-max"
                @click="testWebhook"
                :disabled="isTesting || !webhookUrl"
              >
                <Activity class="h-4 w-4 mr-2" :class="{ 'animate-pulse text-primary-500': isTesting }" /> 
                {{ isTesting ? 'Test...' : 'Tester' }}
              </Button>
            </div>
            <p class="text-[11px] text-neutral-400 font-medium">Les requêtes HTTP POST seront envoyées à cette adresse.</p>
          </div>

          <div class="pt-4 flex justify-end">
            <Button @click="saveSettings" class="bg-primary-600 hover:bg-primary-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary-100">
              <Save class="h-4 w-4 mr-2" /> Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <!-- Logs Box -->
      <div class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h3 class="text-lg font-display font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Activity class="h-5 w-5 text-neutral-400" /> 10 derniers appels
        </h3>
        
        <div v-if="logs.length === 0" class="text-center py-8 text-neutral-400 italic text-sm">
          Aucun appel webhook pour le moment.
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="log in logs" 
            :key="log.id"
            class="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <CheckCircle2 v-if="log.success" class="h-5 w-5 text-green-500 shrink-0" />
              <XCircle v-else class="h-5 w-5 text-red-500 shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-bold text-neutral-800 truncate">{{ log.event }}</p>
                <p class="text-[10px] text-neutral-400 font-medium truncate" :title="log.url">
                  {{ log.url }}
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] font-bold text-neutral-500 block leading-tight">{{ formatDate(log.timestamp) }}</span>
              <span v-if="log.error" class="text-[10px] text-red-500 font-medium leading-tight">Erreur</span>
              <span v-else class="text-[10px] text-green-600 font-medium leading-tight">Succès</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

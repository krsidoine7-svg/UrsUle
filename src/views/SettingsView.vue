<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  Webhook, 
  Save, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Cloud, 
  Database, 
  Link2, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  HelpCircle, 
  Shield, 
  AlertTriangle 
} from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast/use-toast'
import { webhookService, type WebhookLog } from '@/services/webhook.service'
import { driveService } from '@/services/drive.service'

const { toast } = useToast()

const activeTab = ref('automation')
const webhookUrl = ref('')
const isTesting = ref(false)
const logs = ref<WebhookLog[]>([])

const isRestoring = ref(false)
const autoSyncEnabled = ref(localStorage.getItem('ursule_google_auto_sync') === 'true')
const expandedLogId = ref<string | null>(null)

const lastSyncText = computed(() => {
  if (!driveService.lastSyncDate.value) return 'Jamais'
  try {
    const d = new Date(driveService.lastSyncDate.value)
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Jamais'
  }
})

function toggleAutoSync() {
  localStorage.setItem('ursule_google_auto_sync', String(autoSyncEnabled.value))
}

function onAutoSyncChange(val: boolean) {
  autoSyncEnabled.value = val
  toggleAutoSync()
}

async function connectGoogle() {
  try {
    await driveService.connectGoogle()
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

function disconnectGoogle() {
  driveService.disconnectGoogle()
  toast({ title: 'Déconnecté', description: 'Le compte Google Drive a été dissocié.' })
}

async function runBackup() {
  try {
    await driveService.uploadBackupToDrive()
    toast({ title: 'Sauvegarde réussie ! 🎉', description: 'Vos données ont été enregistrées sur votre Google Drive.' })
  } catch (e: any) {
    toast({ title: 'Échec de la sauvegarde', description: e.message, variant: 'destructive' })
  }
}

async function confirmRestore() {
  if (!confirm('Attention: La restauration va fusionner et écraser les données existantes. Voulez-vous continuer ?')) {
    return
  }

  isRestoring.value = true
  try {
    const backup = await driveService.downloadBackupFromDrive()
    await driveService.restoreBackupData(backup)
    toast({ title: 'Restauration réussie ! 🚀', description: 'Toutes vos données ont été restaurées avec succès. Rechargez la page pour les voir.' })
  } catch (e: any) {
    toast({ title: 'Échec de la restauration', description: e.message, variant: 'destructive' })
  } finally {
    isRestoring.value = false
  }
}

async function updateLogs() {
  logs.value = await webhookService.getLogs()
}

function saveSettings() {
  if (webhookUrl.value && !webhookService.isValidWebhookUrl(webhookUrl.value)) {
    toast({ title: 'URL invalide', description: 'L\'URL doit commencer par https://', variant: 'destructive' })
    return
  }
  webhookService.setGlobalWebhookUrl(webhookUrl.value)
  toast({ title: 'Paramètres sauvegardés ! ✨' })
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
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getEventLabel(event: string) {
  const labels: Record<string, string> = {
    task_created: 'Tâche créée',
    task_completed: 'Tâche complétée',
    task_overdue: 'Tâche expirée',
    task_rescheduled: 'Tâche replanifiée',
    test: 'Test de connexion'
  }
  return labels[event] || event
}

function toggleLog(id: string) {
  expandedLogId.value = expandedLogId.value === id ? null : id
}

onMounted(() => {
  webhookUrl.value = webhookService.getGlobalWebhookUrl()
  updateLogs()
  window.addEventListener('webhook-logs-updated', updateLogs)
})

onUnmounted(() => {
  window.removeEventListener('webhook-logs-updated', updateLogs)
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 md:p-8 font-body h-full overflow-y-auto no-scrollbar relative z-10">
    
    <!-- Blobs de lumière d'arrière-plan (effet de profondeur) -->
    <div class="absolute -top-16 -left-16 w-72 h-72 bg-primary-400/10 dark:bg-primary-900/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
    <div class="absolute top-1/4 -right-16 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-900/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
    <div class="absolute -bottom-16 left-1/3 w-96 h-96 bg-indigo-400/15 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

    <!-- Header Page Premium -->
    <div class="mb-10 relative">
      <div class="flex items-center gap-3 mb-2">
        <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-black tracking-wider uppercase">
          Espace de Travail
        </span>
      </div>
      <h1 class="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-neutral-950 via-primary-800 to-indigo-900 dark:from-white dark:via-primary-300 dark:to-indigo-200 bg-clip-text text-transparent">
        Paramètres
      </h1>
      <p class="text-neutral-500 dark:text-neutral-400 font-medium mt-1.5 text-base">
        Ajustez vos préférences de synchronisation et configurez vos automatisations cloud.
      </p>
    </div>

    <!-- Tabs Pill Menu Premium (Style Dock) -->
    <div class="inline-flex p-1.5 bg-neutral-100/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 mb-10 shadow-inner">
      <button 
        class="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
        :class="activeTab === 'automation' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-md border border-neutral-200/30 dark:border-neutral-700/50' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'"
        @click="activeTab = 'automation'"
      >
        <Webhook class="h-4.5 w-4.5 transition-transform duration-300" :class="activeTab === 'automation' ? 'text-primary-500 rotate-12' : 'text-neutral-400'" />
        Automatisation
      </button>
      <button 
        class="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
        :class="activeTab === 'backup' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-md border border-neutral-200/30 dark:border-neutral-700/50' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'"
        @click="activeTab = 'backup'"
      >
        <Cloud class="h-4.5 w-4.5 transition-transform duration-300" :class="activeTab === 'backup' ? 'text-emerald-500' : 'text-neutral-400'" />
        Sauvegarde Cloud
      </button>
    </div>

    <!-- Contenu Automatisation (Webhooks) -->
    <div v-if="activeTab === 'automation'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <!-- Configuration Box (Glassmorphism) -->
      <div class="relative overflow-hidden bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-200/50 dark:border-neutral-800/40 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] transition-all duration-500">
        
        <div class="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 class="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
              <span class="p-2.5 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-2xl inline-block shadow-sm">
                <Webhook class="h-6 w-6" />
              </span>
              Webhooks de l'Application
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Connectez UrsUle à Make, Zapier ou n8n pour réagir aux événements de vos tâches en temps réel.
            </p>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="space-y-2.5">
            <label class="text-xs font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              URL du Webhook Global
            </label>
            <div class="flex flex-col md:flex-row gap-3">
              <div class="relative flex-1 flex items-center group">
                <span class="absolute left-4 text-neutral-400 group-focus-within:text-primary-500 dark:text-neutral-500 transition-colors duration-300">
                  <Link2 class="h-5 w-5" />
                </span>
                <Input 
                  v-model="webhookUrl" 
                  placeholder="https://hook.make.com/..." 
                  class="w-full pl-12 pr-4 bg-neutral-50/50 dark:bg-neutral-950/40 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl h-13 focus:bg-white dark:focus:bg-neutral-950 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-300 text-neutral-800 dark:text-neutral-100"
                />
              </div>
              <Button 
                variant="outline" 
                class="h-13 px-6 font-bold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-2xl shadow-sm transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                @click="testWebhook"
                :disabled="isTesting || !webhookUrl"
              >
                <Activity class="h-4 w-4" :class="{ 'animate-pulse text-primary-500': isTesting }" /> 
                {{ isTesting ? 'Envoi...' : 'Tester le flux' }}
              </Button>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium pt-1">
              <Info class="h-3.5 w-3.5" />
              <span>Les requêtes HTTP POST seront envoyées à cette adresse avec le payload complet de la tâche associée.</span>
            </div>
          </div>

          <div class="pt-4 flex justify-end border-t border-neutral-100/50 dark:border-neutral-800/40">
            <Button 
              @click="saveSettings" 
              class="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white h-13 px-8 rounded-2xl font-bold shadow-lg shadow-primary-500/15 hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <Save class="h-4.5 w-4.5 mr-2" /> Enregistrer les configurations
            </Button>
          </div>
        </div>
      </div>

      <!-- Logs Box (Console Développeur) -->
      <div class="bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-200/50 dark:border-neutral-800/40 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] transition-all duration-500">
        
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2.5">
            <Terminal class="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            Historique des Appels
          </h3>
          <span class="text-xs font-black uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-lg">
            {{ logs.length }} logs
          </span>
        </div>
        
        <!-- Vide State -->
        <div v-if="logs.length === 0" class="text-center py-12 text-neutral-400 dark:text-neutral-500 italic text-sm border-2 border-dashed border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl bg-neutral-50/20 dark:bg-neutral-950/10">
          <Activity class="h-8 w-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-700 animate-pulse" />
          Aucun événement webhook enregistré pour le moment.
        </div>
        
        <!-- Logs List -->
        <div v-else class="space-y-3">
          <div 
            v-for="log in logs" 
            :key="log.id"
            class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/20 shadow-sm transition-all duration-300 hover:shadow-md"
            :class="log.success ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'"
          >
            <!-- Log Header Line (Clickable) -->
            <div 
              @click="toggleLog(log.id)"
              class="flex items-center justify-between gap-3 p-4.5 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors duration-200"
            >
              <div class="flex items-center gap-4.5 min-w-0 flex-1">
                <!-- Status Dot Badge -->
                <span 
                  class="h-8.5 w-8.5 flex items-center justify-center rounded-xl shrink-0"
                  :class="log.success ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/35 text-red-600 dark:text-red-400'"
                >
                  <CheckCircle2 v-if="log.success" class="h-4.5 w-4.5" />
                  <XCircle v-else class="h-4.5 w-4.5" />
                </span>
                
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-black uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      POST
                    </span>
                    <p class="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                      {{ getEventLabel(log.event) }}
                    </p>
                  </div>
                  <p class="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium truncate mt-1 max-w-[280px] sm:max-w-[400px]">
                    {{ log.url }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-3.5 shrink-0">
                <div class="text-right">
                  <span class="text-[10px] font-black tracking-wider text-neutral-400 dark:text-neutral-500 block uppercase">
                    {{ formatDate(log.timestamp) }}
                  </span>
                </div>
                <span class="text-neutral-400 dark:text-neutral-500">
                  <ChevronDown v-if="expandedLogId !== log.id" class="h-4.5 w-4.5" />
                  <ChevronUp v-else class="h-4.5 w-4.5" />
                </span>
              </div>
            </div>

            <!-- Expanded Details (Accordion Panel) -->
            <div 
              v-if="expandedLogId === log.id" 
              class="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-950/20 text-xs font-mono text-neutral-600 dark:text-neutral-400 space-y-3 animate-in slide-in-from-top-2 duration-300"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/50">
                <div>
                  <span class="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Identifiant Unique</span>
                  <span class="font-bold text-neutral-700 dark:text-neutral-300 select-all">{{ log.id }}</span>
                </div>
                <div>
                  <span class="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">URL Cible</span>
                  <span class="font-bold text-neutral-700 dark:text-neutral-300 select-all truncate block" :title="log.url">{{ log.url }}</span>
                </div>
              </div>
              <div>
                <span class="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-1.5">Réponse Technique</span>
                <div class="p-4 bg-neutral-950 text-neutral-200 rounded-xl border border-neutral-800 overflow-x-auto text-[11px] leading-relaxed shadow-inner">
                  <span v-if="log.success" class="text-emerald-400 font-bold">✓ Requête délivrée avec succès. HTTP Status 200 OK.</span>
                  <span v-else class="text-red-400 font-bold block">
                    ✗ Échec de transmission. HTTP Connection Error :
                    <span class="block text-neutral-300 font-medium mt-1 pl-4 border-l-2 border-red-500/50">
                      {{ log.error || 'Aucune erreur technique renvoyée.' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Contenu Sauvegarde Cloud -->
    <div v-if="activeTab === 'backup'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <!-- Association Google Box -->
      <div class="bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-200/50 dark:border-neutral-800/40 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] transition-all duration-500">
        
        <div class="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
              <span class="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block shadow-sm">
                <Cloud class="h-6 w-6" />
              </span>
              Synchronisation Google Drive
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Sauvegardez vos tâches, projets et notes automatiquement ou manuellement dans votre espace Google Drive personnel de manière isolée et sécurisée.
            </p>
          </div>
        </div>
        
        <div class="space-y-6">
          
          <!-- Connection State Panel -->
          <div class="flex flex-col md:flex-row items-center justify-between gap-5 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
            <div class="flex items-center gap-4.5 w-full md:w-auto">
              <div 
                class="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 flex items-center justify-center shadow-sm shrink-0"
              >
                <!-- Custom Google Icon with Google Colors -->
                <svg class="h-7 w-7" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              
              <div class="min-w-0">
                <p class="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  Stockage Cloud Google
                </p>
                <div v-if="driveService.isConnected.value" class="flex items-center gap-2 mt-1">
                  <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Compte connecté et synchronisé
                  </p>
                </div>
                <p v-else class="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-medium">
                  Aucun compte associé pour le moment.
                </p>
              </div>
            </div>
            
            <div class="w-full md:w-auto">
              <Button 
                v-if="!driveService.isConnected.value"
                @click="connectGoogle"
                class="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <Cloud class="h-4.5 w-4.5 mr-2" /> Associer mon compte
              </Button>
              <Button 
                v-else
                variant="outline"
                @click="disconnectGoogle"
                class="w-full md:w-auto border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 font-bold h-12 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Déconnecter le compte
              </Button>
            </div>
          </div>

          <!-- Actions & Sync Panel -->
          <div v-if="driveService.isConnected.value" class="space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-500">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- KPI Card (Dernière sauvegarde) -->
              <div class="relative overflow-hidden p-6 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white/40 dark:bg-neutral-900/20 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 class="text-xs font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 mb-3">
                    <Database class="h-4 w-4" />
                    Statut de la Sauvegarde
                  </h3>
                  <div class="space-y-1">
                    <span class="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block uppercase">
                      Dernière synchronisation
                    </span>
                    <p class="text-2xl md:text-3xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
                      {{ lastSyncText }}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start gap-2.5 mt-5 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                  <Shield class="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>UrsUle stocke un fichier unique chiffré ou structuré nommé <code class="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-neutral-700 dark:text-neutral-300">ursule-backup.json</code> à la racine de votre Drive.</span>
                </div>
              </div>

              <!-- Button Actions -->
              <div class="flex flex-col gap-4 justify-center">
                <Button 
                  @click="runBackup"
                  :disabled="driveService.isSyncing.value"
                  class="h-13 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/15 hover:shadow-xl hover:shadow-primary-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  <RefreshCw class="h-4.5 w-4.5" :class="{ 'animate-spin': driveService.isSyncing.value }" />
                  {{ driveService.isSyncing.value ? 'Synchronisation...' : 'Sauvegarder maintenant' }}
                </Button>
                <Button 
                  variant="outline"
                  @click="confirmRestore"
                  :disabled="isRestoring"
                  class="h-13 rounded-2xl font-bold border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  <Save class="h-4.5 w-4.5" :class="{ 'animate-pulse text-emerald-500': isRestoring }" />
                  {{ isRestoring ? 'Restauration...' : 'Restaurer mes données' }}
                </Button>
              </div>
            </div>

            <!-- Auto-Sync Toggle Card -->
            <div class="p-6 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white/40 dark:bg-neutral-900/20 shadow-sm flex items-center justify-between gap-5">
              <div class="max-w-[80%]">
                <p class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Synchronisation automatique en arrière-plan</p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-medium leading-relaxed">
                  UrsUle effectuera une sauvegarde automatique silencieuse vers Google Drive 5 secondes après chaque initialisation de l'application.
                </p>
              </div>
              <div class="flex items-center shrink-0">
                <Switch 
                  :checked="autoSyncEnabled" 
                  @update:checked="onAutoSyncChange" 
                />
              </div>
            </div>
            
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

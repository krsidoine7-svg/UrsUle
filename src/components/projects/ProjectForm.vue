<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useProjectsStore } from '@/stores/projects.store'
import { useToast } from '@/components/ui/toast/use-toast'
import { 
  FolderOpen, 
  Rocket, 
  Star, 
  Target, 
  Briefcase, 
  Book, 
  Heart, 
  Smile,
  Zap,
  Globe,
  Palette,
  Flag,
  Coffee,
  Code,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  project?: any // Si édition
}>()

const emit = defineEmits(['close'])

const projectsStore = useProjectsStore()
const { toast } = useToast()

const isLoading = ref(false)
const form = ref({
  name: '',
  description: '',
  color: '#10B981',
  icon: 'FolderOpen',
  status: 'active' as any,
  deadline: '',
  budget: 0,
  budget_currency: 'FCFA'
})

const colors = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316'  // Orange
]

const icons = [
  { name: 'FolderOpen', component: FolderOpen },
  { name: 'Rocket', component: Rocket },
  { name: 'Target', component: Target },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Star', component: Star },
  { name: 'Book', component: Book },
  { name: 'Heart', component: Heart },
  { name: 'Smile', component: Smile },
  { name: 'Zap', component: Zap },
  { name: 'Globe', component: Globe },
  { name: 'Palette', component: Palette },
  { name: 'Flag', component: Flag },
  { name: 'Coffee', component: Coffee },
  { name: 'Code', component: Code },
  { name: 'CheckCircle2', component: CheckCircle2 },
  { name: 'AlertCircle', component: AlertCircle }
]

watch(() => props.project, (newVal) => {
  if (newVal) {
    form.value = {
      name: newVal.name,
      description: newVal.description || '',
      color: newVal.color,
      icon: newVal.icon,
      status: newVal.status,
      deadline: newVal.deadline ? newVal.deadline.split('T')[0] : '',
      budget: newVal.budget || 0,
      budget_currency: newVal.budget_currency || 'FCFA'
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: '',
    color: '#10B981',
    icon: 'FolderOpen',
    status: 'active',
    deadline: '',
    budget: 0,
    budget_currency: 'FCFA'
  }
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  
  // 🚀 FERMETURE ET ÉMISSION IMMÉDIATE POUR EXPÉRIENCE INSTANTANÉE !
  emit('close')
  
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description || null,
      color: form.value.color,
      icon: form.value.icon,
      status: form.value.status,
      deadline: form.value.deadline ? new Date(form.value.deadline).toISOString() : null, // Résout l'erreur de date vide "" -> null
      budget: form.value.budget ? Number(form.value.budget) : null, // Résout l'erreur de budget vide -> null
      budget_currency: form.value.budget_currency
    }

    if (props.project) {
      console.log("📡 Mise à jour projet en arrière-plan ID:", props.project.id);
      await projectsStore.updateProject(props.project.id, payload)
      toast({ 
        title: 'Projet mis à jour ! ✨', 
        description: `Le projet "${payload.name}" a été enregistré.` 
      })
    } else {
      console.log("📡 Création projet en arrière-plan...");
      await projectsStore.createProject(payload)
      toast({ 
        title: 'Projet créé ! 🚀', 
        description: `Le projet "${payload.name}" est prêt.` 
      })
    }
    resetForm()
  } catch (e: any) {
    console.error("❌ Erreur lors de la sauvegarde du projet:", e);
    toast({ 
      title: 'Échec de la sauvegarde ⚠️', 
      description: e.message || 'Impossible d\'enregistrer le projet. Vérifie ta connexion.', 
      variant: 'destructive' 
    })
  }
}
</script>

<template>
  <Sheet :open="isOpen" @update:open="$emit('close')">
    <SheetContent side="right" class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader class="mb-8">
        <SheetTitle class="text-2xl font-display font-bold">
          {{ project ? 'Modifier le projet' : 'Nouveau projet' }}
        </SheetTitle>
        <SheetDescription>
          Organise tes tâches dans un projet dédié pour mieux suivre tes progrès.
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 pb-10">
        <!-- Nom -->
        <div class="space-y-2">
          <Label for="name">Nom du projet</Label>
          <Input 
            id="name" 
            v-model="form.name" 
            placeholder="Ex: Lancement Boutique" 
            required
            class="h-12 bg-neutral-50/50"
          />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea 
            id="description" 
            v-model="form.description" 
            placeholder="Quel est l'objectif de ce projet ?"
            class="min-h-[100px] bg-neutral-50/50"
          />
        </div>

        <!-- Couleur -->
        <div class="space-y-3">
          <Label>Couleur thématique</Label>
          <div class="flex flex-wrap gap-3">
            <button 
              v-for="c in colors" 
              :key="c"
              type="button"
              @click="form.color = c"
              class="w-8 h-8 rounded-full border-2 transition-all scale-100 hover:scale-110"
              :style="{ backgroundColor: c, borderColor: form.color === c ? '#000' : 'transparent' }"
            ></button>
          </div>
        </div>

        <!-- Icône -->
        <div class="space-y-3">
          <Label>Icône</Label>
          <div class="grid grid-cols-4 gap-3">
            <button 
              v-for="icon in icons" 
              :key="icon.name"
              type="button"
              @click="form.icon = icon.name"
              class="flex items-center justify-center h-12 rounded-xl border-2 transition-all hover:bg-neutral-50"
              :class="[form.icon === icon.name ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-neutral-100 text-neutral-400']"
            >
              <component :is="icon.component" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Statut -->
          <div class="space-y-2">
            <Label for="status">Statut</Label>
            <Select v-model="form.status">
              <SelectTrigger class="bg-neutral-50/50">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Deadline -->
          <div class="space-y-2">
            <Label for="deadline">Échéance</Label>
            <Input 
              id="deadline" 
              type="date" 
              v-model="form.deadline"
              class="bg-neutral-50/50"
            />
          </div>
        </div>

        <!-- Budget -->
        <div class="space-y-2">
          <Label for="budget">Budget estimé (FCFA)</Label>
          <div class="relative">
            <Input 
              id="budget" 
              type="number" 
              v-model="form.budget"
              class="pl-4 pr-16 bg-neutral-50/50"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
              FCFA
            </span>
          </div>
        </div>

        <SheetFooter class="pt-6">
          <Button 
            type="submit" 
            class="w-full h-12 bg-primary-600 hover:bg-primary-700 font-bold shadow-lg shadow-primary-100"
            :disabled="isLoading || !form.name.trim()"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ project ? 'Sauvegarder les modifications' : 'Créer le projet' }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>

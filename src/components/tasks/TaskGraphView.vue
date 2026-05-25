<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { Network, ZoomIn, ZoomOut, Maximize2, Info, Sparkles, Layout } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { VNetworkGraph } from 'v-network-graph'
import "v-network-graph/lib/style.css"
// Importation de v-network-graph
import * as vNG from "v-network-graph"
import { useProjectsStore } from '@/stores/projects.store'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits(['open-detail'])

const projectsStore = useProjectsStore()

// 1. Prepare Nodes and Edges
const graph = ref<vNG.Instance>()
const nodes = computed(() => {
  const n: Record<string, any> = {}
  
  // Add Project Nodes
  projectsStore.projects.forEach(p => {
    n[`project-${p.id}`] = { 
      name: p.name, 
      color: p.color || '#3b82f6',
      type: 'project',
      size: 28
    }
  })

  // Add Task Nodes
  props.tasks.forEach(t => {
    // Calculer la taille selon la priorité
    let taskSize = 16
    if (t.priority === 'urgent') taskSize = 22
    else if (t.priority === 'high') taskSize = 19
    else if (t.priority === 'low') taskSize = 13

    n[`task-${t.id}`] = { 
      name: t.title, 
      color: t.category?.color || '#94a3b8',
      type: 'task',
      size: taskSize,
      status: t.status,
      priority: t.priority
    }
  })

  return n
})

const edges = computed(() => {
  const e: Record<string, any> = {}
  let count = 0

  props.tasks.forEach(t => {
    // Link Task to Project
    // Only link to project if it doesn't have a parent task to keep a clean tree
    if (t.project_id && !t.parent_task_id) {
      e[`edge-${count++}`] = { 
        source: `project-${t.project_id}`, 
        target: `task-${t.id}`,
        type: 'project'
      }
    }
    // Link Subtask to Parent Task
    if (t.parent_task_id) {
      e[`edge-${count++}`] = { 
        source: `task-${t.parent_task_id}`, 
        target: `task-${t.id}`,
        type: 'subtask'
      }
    }
  })

  return e
})

const hoveredNode = ref<string | null>(null)

const eventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    if (node.startsWith('task-')) {
      const taskId = node.replace('task-', '')
      const task = props.tasks.find(t => t.id === taskId)
      if (task) emit('open-detail', task)
    }
  },
  "node:pointerover": ({ node }) => {
    hoveredNode.value = node
  },
  "node:pointerout": () => {
    hoveredNode.value = null
  }
}

// Trouver les voisins du nœud survolé
const neighboringNodes = computed(() => {
  if (!hoveredNode.value) return new Set()
  const neighbors = new Set([hoveredNode.value])
  Object.values(edges.value).forEach(edge => {
    if (edge.source === hoveredNode.value) neighbors.add(edge.target)
    if (edge.target === hoveredNode.value) neighbors.add(edge.source)
  })
  return neighbors
})

const neighboringEdges = computed(() => {
  if (!hoveredNode.value) return new Set()
  const eIds = new Set()
  Object.entries(edges.value).forEach(([id, edge]) => {
    if (edge.source === hoveredNode.value || edge.target === hoveredNode.value) {
      eIds.add(id)
    }
  })
  return eIds
})

// 2. Graph Styles
const configs = reactive(
  vNG.defineConfigs({
    view: {
      autoPanAndZoomOnLoad: "fit-content",
      mouseWheelZoomEnabled: true,
    },
    node: {
      selectable: true,
      draggable: true,
      normal: {
        type: "circle",
        radius: n => n.size,
        color: n => n.color,
        strokeWidth: n => n.type === 'project' ? 2 : (n.priority === 'urgent' ? 3 : 0),
        strokeColor: n => n.type === 'project' ? "#fff" : "#ef4444",
        // @ts-expect-error: VNetworkGraph node opacity type mismatch
        opacity: (n: any) => {
          if (!hoveredNode.value) return 1
          return neighboringNodes.value.has(n.id) ? 1 : 0.1
        }
      },
      hover: {
        radius: n => n.size + 2,
        color: n => n.color,
      },
      label: {
        visible: true,
        fontFamily: "Inter, sans-serif",
        fontSize: (n: any) => n.type === 'project' ? 11 : 9,
        lineHeight: 1.1,
        color: (n: any) => n.type === 'project' ? "#1e293b" : "#64748b",
        margin: 6,
        direction: "south",
      }
    },
    edge: {
      normal: {
        width: e => e.type === 'project' ? 1.5 : 1,
        color: "#cbd5e1",
        dasharray: (e: any) => e.type === 'subtask' ? "4 4" : "0",
        // @ts-expect-error: VNetworkGraph edge opacity type mismatch
        opacity: (e: any) => {
          if (!hoveredNode.value) return 1
          return neighboringEdges.value.has(e.id) ? 1 : 0.1
        },
        marker: {
          target: {
            type: "arrow",
            width: 4,
            height: 4,
          }
        }
      },
      hover: {
        width: 2,
        color: "#3b82f6",
      },
    }
  })
)

const layouts = reactive<vNG.Layouts>({
  nodes: {},
})

function reorganize() {
  const newLayouts: Record<string, { x: number, y: number }> = {}
  const horizontalGap = 200
  const verticalGap = 180
  const widthCache = new Map<string, number>()
  
  // 1. Identifier les racines
  const rootProjects = projectsStore.projects
  const orphanTasks = props.tasks.filter(t => !t.project_id && !t.parent_task_id)

  // 2. Calculer la largeur de chaque sous-arbre de manière récursive (pour l'espacement)
  const getSubtreeWidth = (id: string, type: 'project' | 'task'): number => {
    const cacheKey = `${type}-${id}`
    if (widthCache.has(cacheKey)) return widthCache.get(cacheKey)!

    let childrenIds: string[] = []
    if (type === 'project') {
      childrenIds = props.tasks
        .filter(t => t.project_id === id && !t.parent_task_id)
        .map(t => t.id)
    } else {
      childrenIds = props.tasks
        .filter(t => t.parent_task_id === id)
        .map(t => t.id)
    }

    if (childrenIds.length === 0) {
      widthCache.set(cacheKey, horizontalGap)
      return horizontalGap
    }

    const totalWidth = childrenIds.reduce((sum, childId) => sum + getSubtreeWidth(childId, 'task'), 0)
    const finalWidth = Math.max(horizontalGap, totalWidth)
    widthCache.set(cacheKey, finalWidth)
    return finalWidth
  }

  // 3. Fonction récursive de positionnement
  const positionNode = (id: string, type: 'project' | 'task', xStart: number, y: number): number => {
    const nodeKey = type === 'project' ? `project-${id}` : `task-${id}`
    const totalWidth = getSubtreeWidth(id, type)
    const centerX = xStart + totalWidth / 2
    
    newLayouts[nodeKey] = { x: centerX, y }

    let childrenIds: string[] = []
    if (type === 'project') {
      childrenIds = props.tasks
        .filter(t => t.project_id === id && !t.parent_task_id)
        .map(t => t.id)
    } else {
      childrenIds = props.tasks
        .filter(t => t.parent_task_id === id)
        .map(t => t.id)
    }

    let currentX = xStart
    childrenIds.forEach(childId => {
      const childWidth = getSubtreeWidth(childId, 'task')
      positionNode(childId, 'task', currentX, y + verticalGap)
      currentX += childWidth
    })

    return totalWidth
  }

  // 4. Lancer le positionnement pour chaque racine
  let globalX = 0
  rootProjects.forEach(p => {
    globalX += positionNode(p.id, 'project', globalX, 0) + horizontalGap
  })

  orphanTasks.forEach(t => {
    globalX += positionNode(t.id, 'task', globalX, verticalGap) + horizontalGap
  })

  layouts.nodes = newLayouts
  setTimeout(() => fitContent(), 100)
}

onMounted(() => {
  setTimeout(reorganize, 500)
})

function zoomIn() { graph.value?.zoomIn() }
function zoomOut() { graph.value?.zoomOut() }
function fitContent() { graph.value?.fitToContents() }
</script>

<template>
  <div class="h-[650px] bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col overflow-hidden relative group animate-fade-in">
    <!-- Graph Header -->
    <div class="p-6 border-b border-neutral-50 flex items-center justify-between z-10 bg-white/80 backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
          <Network class="h-6 w-6" />
        </div>
        <div>
          <h3 class="text-xl font-display font-black text-neutral-900 tracking-tight">Graphe de Relations</h3>
          <p class="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
            <Info class="h-3 w-3" /> Visualise les liens entre tes projets et tes tâches.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center bg-neutral-100 p-1 rounded-xl gap-1 mr-4">
           <Button @click="zoomIn" variant="ghost" size="icon" class="h-8 w-8 rounded-lg hover:bg-white text-neutral-500">
            <ZoomIn class="h-4 w-4" />
          </Button>
          <Button @click="zoomOut" variant="ghost" size="icon" class="h-8 w-8 rounded-lg hover:bg-white text-neutral-500">
            <ZoomOut class="h-4 w-4" />
          </Button>
        </div>
        <Button @click="reorganize" variant="outline" class="h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white border-none font-bold shadow-lg shadow-primary-100 px-4 transition-all hover:scale-105 active:scale-95">
          <Sparkles class="h-4 w-4 mr-2" /> Réorganiser
        </Button>
        <Button @click="fitContent" variant="outline" size="icon" class="rounded-xl h-10 w-10 border-neutral-200" title="Recentrer">
          <Maximize2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Graph Canvas -->
    <div class="flex-1 bg-neutral-50/30 relative overflow-hidden">
      <!-- Grid Background -->
      <div class="absolute inset-0" style="background-image: radial-gradient(#e5e5e5 1px, transparent 1px); background-size: 32px 32px;"></div>

      <VNetworkGraph
        ref="graph"
        v-model:layouts="layouts"
        :nodes="nodes"
        :edges="edges"
        :configs="configs"
        :event-handlers="eventHandlers"
        class="w-full h-full"
      >
        <!-- Customizing Node Content (Icons) -->
        <template #override-node="{ nodeId, scale, config, ...slotProps }">
          <!-- Main Circle -->
          <circle
            :r="config.radius * scale"
            :fill="config.color"
            :stroke="config.strokeColor"
            :stroke-width="config.strokeWidth * scale"
            v-bind="slotProps"
            class="transition-all duration-300"
          />
          
          <!-- Icon for Projects (Simple Folder shape) -->
          <path
            v-if="nodes[nodeId]?.type === 'project'"
            :d="`M ${-5*scale} ${-4*scale} L ${-5*scale} ${4*scale} L ${5*scale} ${4*scale} L ${5*scale} ${-2*scale} L ${2*scale} ${-2*scale} L ${0} ${-4*scale} Z`"
            fill="white"
            stroke="white"
            :stroke-width="1 * scale"
            style="pointer-events: none"
          />

          <!-- Status indicator for tasks -->
          <circle
            v-if="nodes[nodeId]?.type === 'task' && nodes[nodeId]?.status === 'done'"
            :r="5 * scale"
            :cx="config.radius * 0.7 * scale"
            :cy="-config.radius * 0.7 * scale"
            fill="#22c55e"
            stroke="#fff"
            :stroke-width="1.5 * scale"
          />
          <!-- Icon check for done tasks -->
          <path
            v-if="nodes[nodeId]?.type === 'task' && nodes[nodeId]?.status === 'done'"
            :d="`M ${config.radius * 0.5 * scale} ${-config.radius * 0.7 * scale} L ${config.radius * 0.65 * scale} ${-config.radius * 0.55 * scale} L ${config.radius * 0.9 * scale} ${-config.radius * 0.85 * scale}`"
            fill="none"
            stroke="white"
            :stroke-width="1.5 * scale"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </template>
      </VNetworkGraph>

      <!-- Legend -->
      <div class="absolute bottom-6 left-6 flex items-center gap-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-neutral-100 shadow-xl">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
          <span class="text-[10px] font-black uppercase text-neutral-500">Projets</span>
        </div>
        <div class="flex items-center gap-2 border-l border-neutral-100 pl-4">
          <div class="w-2 h-2 rounded-full bg-neutral-400"></div>
          <span class="text-[10px] font-black uppercase text-neutral-500">Tâches</span>
        </div>
        <div class="flex items-center gap-2 border-l border-neutral-100 pl-4">
          <div class="w-3 h-0.5 bg-neutral-200"></div>
          <span class="text-[10px] font-black uppercase text-neutral-500">Liens</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>

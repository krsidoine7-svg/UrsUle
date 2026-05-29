<template>
  <div class="relative w-full h-full bg-neutral-50 overflow-hidden" ref="containerRef">


    <!-- Panneau d'information fixe (en haut à droite, design sombre premium) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="hoveredNode"
        class="absolute top-4 right-4 z-[99999] pointer-events-none bg-neutral-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-lg shadow-2xl border border-white/10 ring-1 ring-black/20 min-w-[200px]"
      >
        <div class="flex items-center gap-2 mb-1.5">
          <div 
            class="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-neutral-800 shadow-sm"
            :style="{ backgroundColor: hoveredNode.color || '#94a3b8' }"
          ></div>
          <div class="font-bold text-sm tracking-tight truncate max-w-[170px]">{{ hoveredNode.title || 'Sans titre' }}</div>
        </div>
        
        <div class="text-[11px] font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
          <Network class="w-3.5 h-3.5 text-primary-400" />
          <span>{{ hoveredNode.degree }} connexion{{ hoveredNode.degree > 1 ? 's' : '' }}</span>
        </div>

        <div v-if="hoveredNode.tags && hoveredNode.tags.length" class="flex flex-wrap gap-1">
          <span v-for="tag in hoveredNode.tags" :key="tag" class="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px] font-medium border border-neutral-700/50">
            #{{ tag }}
          </span>
        </div>
      </div>
    </transition>

    <!-- Le SVG principal pour D3 -->
    <svg ref="svgRef" class="w-full h-full cursor-grab active:cursor-grabbing"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { linksService, type GraphNode, type GraphEdge } from '@/services/links.service'
import { Network, Crosshair } from 'lucide-vue-next'

const router = useRouter()
const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

// Paramètres
const mode = ref<'tout' | 'libres' | 'reseau'>('tout')
const labelOpacity = ref(0.8)
const hoveredNode = ref<GraphNode | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

// Données D3
const nodes = shallowRef<any[]>([])
const links = shallowRef<any[]>([])

// Variables D3 internes
let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>
let zoom: d3.ZoomBehavior<Element, unknown>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

let linkElements: d3.Selection<SVGLineElement, any, SVGGElement, unknown>
let nodeElements: d3.Selection<SVGGElement, any, SVGGElement, unknown>

// Couleurs par défaut
const DEFAULT_NODE_COLOR = '#94a3b8' // neutral-400
const ACTIVE_COLOR = '#3b82f6' // blue-500

onMounted(async () => {
  await loadData()
  initGraph()
  
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (simulation) simulation.stop()
  window.removeEventListener('resize', handleResize)
})

async function loadData() {
  try {
    const data = await linksService.getGraphData()
    // Cloner pour D3 car D3 mute les objets
    nodes.value = data.nodes.map(n => ({ ...n }))
    links.value = data.edges.map(e => ({ ...e }))
  } catch (e) {
    console.error('Erreur chargement du graphe:', e)
  }
}

function initGraph() {
  if (!svgRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  svg = d3.select(svgRef.value)
  svg.selectAll('*').remove() // Clean up

  // Container pour le zoom
  g = svg.append('g')

  // Configuration du Zoom
  zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom as any)
     .on('dblclick.zoom', null) // Désactiver le zoom au double clic

  // Configuration de la Simulation de Forces
  simulation = d3.forceSimulation(nodes.value)
    .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d.degree) + 5))

  // Dessiner les liens
  linkElements = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links.value)
    .enter().append('line')
    .attr('stroke', '#cbd5e1') // neutral-300
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)

  // Dessiner les nœuds (groupes contenant cercle + texte)
  nodeElements = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes.value)
    .enter().append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
    )
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', handleClick)

  // Cercles
  nodeElements.append('circle')
    .attr('r', (d: any) => getNodeRadius(d.degree))
    .attr('fill', (d: any) => d.color || DEFAULT_NODE_COLOR)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // Labels
  nodeElements.append('text')
    .text((d: any) => d.title || 'Sans titre')
    .attr('x', (d: any) => getNodeRadius(d.degree) + 6)
    .attr('y', 4)
    .style('font-family', 'sans-serif')
    .style('font-size', '12px')
    .style('fill', '#334155') // neutral-700
    .style('font-weight', '500')
    .style('pointer-events', 'none')
    .style('opacity', labelOpacity.value)
    .style('text-shadow', '0 1px 3px rgba(255,255,255,0.8), 0 -1px 3px rgba(255,255,255,0.8), 1px 0 3px rgba(255,255,255,0.8), -1px 0 3px rgba(255,255,255,0.8)')

  // Tick (mise à jour des positions à chaque frame)
  simulation.on('tick', () => {
    linkElements
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    nodeElements
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

// Utilitaires de taille
function getNodeRadius(degree: number) {
  if (degree === 0) return 6
  if (degree < 3) return 8
  if (degree < 8) return 12
  return 18
}

// Drag & Drop
function dragstarted(event: any, d: any) {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged(event: any, d: any) {
  d.fx = event.x
  d.fy = event.y
}

function dragended(event: any, d: any) {
  if (!event.active) simulation.alphaTarget(0)
  if (mode.value === 'tout' || mode.value === 'reseau') {
    d.fx = null
    d.fy = null
  }
}

// Interactions
function handleMouseOver(event: any, d: any) {
  hoveredNode.value = d
  tooltipPos.value = { x: event.clientX, y: event.clientY }

  // Mettre en surbrillance le noeud
  d3.select(event.currentTarget).select('circle')
    .transition().duration(200)
    .attr('r', getNodeRadius(d.degree) + 4)
    .attr('stroke', ACTIVE_COLOR)
    .attr('stroke-width', 3)

  // Opacité des liens
  const connectedNodeIds = new Set<string>()
  connectedNodeIds.add(d.id)

  linkElements
    .transition().duration(200)
    .style('stroke-opacity', (l: any) => {
      if (l.source.id === d.id || l.target.id === d.id) {
        connectedNodeIds.add(l.source.id)
        connectedNodeIds.add(l.target.id)
        return 1
      }
      return 0.1
    })
    .style('stroke', (l: any) => {
      return (l.source.id === d.id || l.target.id === d.id) ? ACTIVE_COLOR : '#cbd5e1'
    })

  // Opacité des noeuds
  nodeElements
    .transition().duration(200)
    .style('opacity', (n: any) => connectedNodeIds.has(n.id) ? 1 : 0.2)
}

function handleMouseOut(event: any, d: any) {
  hoveredNode.value = null

  // Restaurer le noeud
  d3.select(event.currentTarget).select('circle')
    .transition().duration(200)
    .attr('r', getNodeRadius(d.degree))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // Restaurer les liens
  linkElements
    .transition().duration(200)
    .style('stroke-opacity', () => mode.value === 'libres' ? 0 : 0.6)
    .style('stroke', '#cbd5e1')

  // Restaurer les noeuds
  nodeElements
    .transition().duration(200)
    .style('opacity', (n: any) => {
      if (mode.value === 'tout') return 1
      if (mode.value === 'libres') return n.degree === 0 ? 1 : 0
      if (mode.value === 'reseau') return n.degree > 0 ? 1 : 0
      return 1
    })
}

function handleClick(event: any, d: any) {
  router.push(`/brain/notes/${d.id}`)
}

function recenter() {
  if (!svg || !containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  
  svg.transition().duration(750).call(
    zoom.transform as any, 
    d3.zoomIdentity.translate(width / 2, height / 2).scale(1).translate(-width / 2, -height / 2)
  )
}

function updateVisibility() {
  if (!nodeElements || !linkElements) return

  nodeElements
    .transition().duration(300)
    .style('opacity', (d: any) => {
      if (mode.value === 'tout') return 1
      if (mode.value === 'libres') return d.degree === 0 ? 1 : 0
      if (mode.value === 'reseau') return d.degree > 0 ? 1 : 0
      return 1
    })
    .style('pointer-events', (d: any) => {
      if (mode.value === 'tout') return 'all'
      if (mode.value === 'libres') return d.degree === 0 ? 'all' : 'none'
      if (mode.value === 'reseau') return d.degree > 0 ? 'all' : 'none'
      return 'all'
    })

  linkElements
    .transition().duration(300)
    .style('stroke-opacity', () => {
      if (mode.value === 'libres') return 0
      return 0.6
    })
}

function setMode(newMode: 'tout' | 'libres' | 'reseau') {
  mode.value = newMode
  updateVisibility()

  if (!simulation || !containerRef.value) return
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  if (newMode === 'tout') {
    // Mode Tout: Le graphe complet (noeuds connectés + isolés au centre)
    simulation
      .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d.degree) + 5))
    
    // Libérer tous les noeuds
    nodes.value.forEach(d => {
      d.fx = null
      d.fy = null
    })
    
    simulation.alpha(1).restart()
  } else if (newMode === 'libres') {
    // Mode Libres: Uniquement les notes orphelines disposées en grille centrée
    simulation
      .force('link', null)
      .force('charge', null)
      .force('center', null)
      .force('collide', null)
    
    const isolatedNodes = nodes.value.filter(n => n.degree === 0)
    isolatedNodes.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    
    // Grille
    const cols = 3
    const spacingX = 150
    const spacingY = 80
    
    const totalCols = Math.min(isolatedNodes.length, cols)
    const totalRows = Math.ceil(isolatedNodes.length / cols)
    
    const gridWidth = Math.max(0, (totalCols - 1) * spacingX)
    const gridHeight = Math.max(0, (totalRows - 1) * spacingY)
    
    const startX = (width / 2) - (gridWidth / 2)
    const startY = (height / 2) - (gridHeight / 2)
    
    isolatedNodes.forEach((d, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      d.fx = startX + col * spacingX
      d.fy = startY + row * spacingY
    })

    // Figer les autres là où ils sont (ils sont invisibles de toute façon)
    nodes.value.filter(n => n.degree > 0).forEach(d => {
      d.fx = d.x
      d.fy = d.y
    })
    
    simulation.alpha(1).restart()
  } else if (newMode === 'reseau') {
    // Mode Réseau: Uniquement les notes connectées
    simulation
      .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d.degree) + 5))
    
    nodes.value.forEach(d => {
      if (d.degree === 0) {
        // Exclure virtuellement les notes isolées du centre de gravité
        d.fx = -2000
        d.fy = -2000
      } else {
        d.fx = null
        d.fy = null
      }
    })
    
    simulation.alpha(1).restart()
  }
}

function handleResize() {
  if (!simulation || !containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  simulation.force('center', d3.forceCenter(width / 2, height / 2))
  simulation.alpha(0.3).restart()
}

// Watchers
watch(labelOpacity, (val) => {
  if (nodeElements) {
    nodeElements.selectAll('text').style('opacity', val)
  }
})

defineExpose({
  mode,
  labelOpacity,
  setMode,
  recenter
})
</script>

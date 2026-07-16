<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Mention from '@tiptap/extension-mention'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import MentionList from './MentionList.vue'
import { common, createLowlight } from 'lowlight'
import { useNotesStore } from '@/stores/notes.store'
import { sanitizeHtml } from '@/utils/sanitize'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Link as LinkIcon, Hash,
  Search, X, Lock, Share2
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  jsonValue?: any
  readOnly?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'update:jsonValue', 'save', 'share-block'])

const notesStore = useNotesStore()
const router = useRouter()
const { toast } = useToast()
const lowlight = createLowlight(common)

const TagMention = Mention.extend({
  name: 'tagMention'
})

const BlockAttributes = Extension.create({
  name: 'blockAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'taskList'],
        attributes: {
          restricted: {
            default: false,
            parseHTML: element => element.getAttribute('data-restricted') === 'true',
            renderHTML: attributes => {
              if (!attributes.restricted) {
                return {}
              }
              return {
                'data-restricted': 'true',
                class: 'restricted-section-editor'
              }
            },
          },
          blockId: {
            default: null,
            parseHTML: element => element.getAttribute('id') || element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes.blockId) {
                return {}
              }
              return {
                id: attributes.blockId,
                'data-block-id': attributes.blockId
              }
            },
          }
        },
      },
    ]
  },
})

function getSafeInitialContent() {
  if (props.jsonValue && typeof props.jsonValue === 'object' && props.jsonValue.type === 'doc') {
    return props.jsonValue
  }
  return props.modelValue || ''
}

const editor = useEditor({
  editable: !props.readOnly,
  content: getSafeInitialContent(),
  extensions: [
    BlockAttributes,
    StarterKit.configure({
      codeBlock: false, // On utilise CodeBlockLowlight à la place
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: 'Commence à écrire... utilise // pour lier une note, # pour un tag',
    }),
    Link.configure({
      openOnClick: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Mention.configure({
      HTMLAttributes: {
        class: 'mention-note',
      },
      renderLabel({ node }) {
        return `${node.attrs.label ?? node.attrs.id}`
      },
      renderText({ node }) {
        return `${node.attrs.label ?? node.attrs.id}`
      },
      suggestion: {
        char: '//',
        items: ({ query }: { query: string }) => {
          return notesStore.notes
            .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
        },
        render: () => {
          let component: VueRenderer
          let popup: any

          return {
            onStart: (props: any) => {
              component = new VueRenderer(MentionList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component.element as Element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'ursule-mention', // Theme transparent pour laisser briller MentionList
              })
            },

            onUpdate(props: any) {
              component.updateProps(props)

              if (!props.clientRect) {
                return
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any,
              })
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              return component.ref?.onKeyDown(props)
            },

            onExit() {
              if (popup && popup[0]) {
                popup[0].destroy()
              }
              if (component) {
                component.destroy()
              }
            },
          }
        },
      },
    }),
    TagMention.configure({
      suggestion: {
        char: '#',
        items: ({ query }: { query: string }) => {
          return [] // Auto-complétion des tags (optionnel)
        }
      }
    })
  ],
  onCreate: ({ editor }) => {
    const safeContent = getSafeInitialContent()
    if (safeContent && safeContent !== '') {
      try {
        editor.commands.setContent(safeContent, { emitUpdate: false })
      } catch (e) {
        console.warn('Erreur onCreate setContent:', e)
        if (props.modelValue) {
          try {
            editor.commands.setContent(props.modelValue, { emitUpdate: false })
          } catch (e2) {}
        }
      }
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:jsonValue', editor.getJSON())
    emit('update:modelValue', sanitizeHtml(editor.getHTML())) 
    
    // Auto-save logic
    debouncedSave()
  },
})

// Auto-save debounce
let saveTimeout: any
function debouncedSave() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    emit('save')
  }, 1000)
}

function addLink() {
  if (!editor.value) return
  const url = window.prompt('URL')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

watch(() => props.readOnly, (newVal) => {
  if (editor.value) {
    editor.value.setEditable(!newVal)
  }
})

// Mettre à jour le contenu si on change de note de l'extérieur (ex: navigation via lien) ou dès que l'éditeur est monté
watch(() => [props.jsonValue, props.modelValue, editor.value], ([newJson, newHtml, ed]: any[]) => {
  if (!ed) return
  if (newJson && JSON.stringify(ed.getJSON()) !== JSON.stringify(newJson)) {
    try {
      ed.commands.setContent(newJson, { emitUpdate: false })
    } catch (e) {
      console.warn('Tiptap setContent JSON échoué, bascule vers HTML:', e)
      if (newHtml && ed.getHTML() !== newHtml) {
        try {
          ed.commands.setContent(newHtml, { emitUpdate: false })
        } catch (e2) {
          console.error('Erreur setContent HTML:', e2)
        }
      }
    }
  } else if (!newJson && newHtml && ed.getHTML() !== newHtml) {
    try {
      ed.commands.setContent(newHtml, { emitUpdate: false })
    } catch (e) {
      console.error('Erreur setContent HTML:', e)
    }
  }
}, { immediate: true, deep: true })

function handleEditorClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const mentionEl = target.closest('.mention-note') as HTMLElement
  if (mentionEl) {
    const targetNoteId = mentionEl.getAttribute('data-id')
    if (targetNoteId) {
      if (router.currentRoute.value.params.id === targetNoteId) return

      // Vérifier si la note existe dans les notes actives (hors corbeille)
      const activeNote = notesStore.notes.find((n: any) => n.id === targetNoteId)
      if (!activeNote) {
        // Vérifier si elle est dans la corbeille
        const inTrash = notesStore.deletedNotes.find((n: any) => n.id === targetNoteId)
        if (inTrash) {
          toast({
            title: 'Note dans la corbeille',
            description: 'Cette note a été mise à la corbeille et ne peut pas être ouverte directement.',
            variant: 'destructive'
          })
          event.preventDefault()
          event.stopPropagation()
          return
        } else {
          toast({
            title: 'Note introuvable',
            description: 'Cette note n\'existe plus ou a été supprimée.',
            variant: 'destructive'
          })
          event.preventDefault()
          event.stopPropagation()
          return
        }
      }

      event.preventDefault()
      event.stopPropagation()
      router.push(`/brain/notes/${targetNoteId}`)
    }
  }
}

// --- Recherche & Remplacement Locale (Cmd+F) ---
function toggleRestrictedBlock() {
  if (!editor.value) return
  const isRestricted = editor.value.isActive({ restricted: true })
  const parentType = editor.value.state.selection.$head.parent.type.name
  editor.value.chain().focus().updateAttributes(parentType, { restricted: !isRestricted }).run()
}

function shareCurrentBlock() {
  if (!editor.value) return
  const parent = editor.value.state.selection.$head.parent
  let blockId = parent.attrs?.blockId
  if (!blockId) {
    blockId = `block-${Math.random().toString(36).substring(2, 9)}`
    editor.value.chain().focus().updateAttributes(parent.type.name, { blockId }).run()
  }
  emit('share-block', blockId)
}

const showLocalSearch = ref(false)
const localSearchInputRef = ref<HTMLInputElement | null>(null)
const localSearchQuery = ref('')
const localSearchReplace = ref('')
const currentMatchIndex = ref(0)
const totalMatches = ref(0)

interface TextMatch {
  from: number
  to: number
  text: string
}

function getMatches(q: string): TextMatch[] {
  if (!editor.value || !q.trim()) return []
  const matches: TextMatch[] = []
  const lowerQ = q.toLowerCase()
  editor.value.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const lowerText = node.text.toLowerCase()
      let index = lowerText.indexOf(lowerQ)
      while (index !== -1) {
        matches.push({
          from: pos + index,
          to: pos + index + q.length,
          text: node.text.substring(index, index + q.length)
        })
        index = lowerText.indexOf(lowerQ, index + 1)
      }
    }
  })
  return matches
}

function jumpToMatch(index: number) {
  const matches = getMatches(localSearchQuery.value)
  if (matches.length === 0) {
    totalMatches.value = 0
    currentMatchIndex.value = 0
    return
  }
  totalMatches.value = matches.length
  if (index >= matches.length) index = 0
  if (index < 0) index = matches.length - 1
  currentMatchIndex.value = index

  const match = matches[index]
  if (match && editor.value) {
    editor.value.commands.setTextSelection({ from: match.from, to: match.to })
    editor.value.commands.focus()
  }
}

function replaceCurrent() {
  const matches = getMatches(localSearchQuery.value)
  if (matches.length === 0 || !editor.value) return
  const match = matches[currentMatchIndex.value]
  if (match) {
    editor.value.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(localSearchReplace.value)
      .run()
    jumpToMatch(currentMatchIndex.value)
  }
}

function replaceAll() {
  if (!editor.value || !localSearchQuery.value.trim()) return
  const matches = getMatches(localSearchQuery.value)
  if (matches.length === 0) return

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    editor.value.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(localSearchReplace.value)
      .run()
  }
  jumpToMatch(0)
}

function closeLocalSearch() {
  showLocalSearch.value = false
  localSearchQuery.value = ''
  if (editor.value) editor.value.commands.focus()
}

function handleEditorKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    e.stopPropagation()
    showLocalSearch.value = true
    setTimeout(() => {
      localSearchInputRef.value?.focus()
    }, 50)
  } else if (showLocalSearch.value && e.key === 'Escape') {
    e.preventDefault()
    closeLocalSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEditorKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEditorKeyDown)
  if (editor.value) {
    editor.value.destroy()
  }
  clearTimeout(saveTimeout)
})
</script>

<template>
  <div class="note-editor-wrapper flex flex-col h-full bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
    
    <!-- Local Search & Replace Bar (Cmd+F) -->
    <Transition name="fade-slide">
      <div v-if="showLocalSearch" class="p-2.5 bg-neutral-900 text-white dark:bg-neutral-800 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md shrink-0">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search class="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref="localSearchInputRef"
            v-model="localSearchQuery"
            type="text"
            placeholder="Rechercher dans la note..."
            class="bg-neutral-800 dark:bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-500 outline-none focus:border-primary-500 w-44 sm:w-56"
            @input="jumpToMatch(0)"
            @keydown.enter.prevent="jumpToMatch(currentMatchIndex + 1)"
          />
          <span v-if="localSearchQuery" class="text-neutral-400 text-[11px] font-mono whitespace-nowrap">
            {{ totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0' }}
          </span>
          <div class="flex items-center gap-0.5 ml-1">
            <button @click="jumpToMatch(currentMatchIndex - 1)" class="p-1 rounded hover:bg-neutral-800 text-neutral-300 font-bold" title="Occurence précédente (↑)">↑</button>
            <button @click="jumpToMatch(currentMatchIndex + 1)" class="p-1 rounded hover:bg-neutral-800 text-neutral-300 font-bold" title="Occurence suivante (↓ ou Entrée)">↓</button>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            v-model="localSearchReplace"
            type="text"
            placeholder="Remplacer par..."
            class="bg-neutral-800 dark:bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-500 outline-none focus:border-primary-500 w-36 sm:w-44"
          />
          <button
            @click="replaceCurrent()"
            :disabled="totalMatches === 0"
            class="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 transition-colors whitespace-nowrap font-medium"
          >
            Remplacer
          </button>
          <button
            @click="replaceAll()"
            :disabled="totalMatches === 0"
            class="px-2.5 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white transition-colors whitespace-nowrap font-medium"
          >
            Tout remplacer
          </button>
          <button @click="closeLocalSearch()" class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white ml-1">
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Toolbar -->
    <div v-if="editor && !readOnly" class="toolbar border-b border-neutral-100 p-2 flex flex-wrap gap-1 bg-neutral-50 shrink-0">
      <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" class="toolbar-btn" title="Titre 1">
        <Heading1 class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" class="toolbar-btn" title="Titre 2">
        <Heading2 class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" class="toolbar-btn" title="Titre 3">
        <Heading3 class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-neutral-300 mx-1 self-center"></div>

      <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" class="toolbar-btn" title="Gras">
        <Bold class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" class="toolbar-btn" title="Italique">
        <Italic class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" class="toolbar-btn" title="Barré">
        <Strikethrough class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-neutral-300 mx-1 self-center"></div>

      <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" class="toolbar-btn" title="Liste à puces">
        <List class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" class="toolbar-btn" title="Liste numérotée">
        <ListOrdered class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().toggleTaskList().run()" :class="{ 'is-active': editor.isActive('taskList') }" class="toolbar-btn" title="Checklist">
        <CheckSquare class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-neutral-300 mx-1 self-center"></div>

      <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }" class="toolbar-btn" title="Bloc de code">
        <Code class="w-4 h-4" />
      </button>
      
      <div class="w-px h-5 bg-neutral-300 mx-1 self-center"></div>

      <button @click="addLink()" :class="{ 'is-active': editor.isActive('link') }" class="toolbar-btn" title="Lien web">
        <LinkIcon class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().insertContent('#').run()" class="toolbar-btn text-blue-500 font-bold" title="Tag">
        <Hash class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-neutral-300 mx-1 self-center"></div>

      <button @click="toggleRestrictedBlock()" :class="{ 'is-active': editor.isActive({ restricted: true }) }" class="toolbar-btn text-amber-600 hover:bg-amber-100" title="Restreindre ce paragraphe (masqué sur lien public)">
        <Lock class="w-4 h-4" />
      </button>
      <button @click="shareCurrentBlock()" class="toolbar-btn text-blue-600 hover:bg-blue-100" title="Partager uniquement ce bloc en isolation">
        <Share2 class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-white editor-container" @click="handleEditorClick" @dblclick="handleEditorClick">
      <editor-content :editor="editor" class="h-full min-h-[500px]" />
    </div>
  </div>
</template>

<style lang="postcss">
/* Tiptap styles */
.editor-container .ProseMirror {
  outline: none;
  min-height: 100%;
}

.editor-container .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.toolbar-btn {
  @apply p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors;
}

.toolbar-btn.is-active {
  @apply bg-neutral-200 text-neutral-900 font-bold;
}

/* Mentions (Proposition 1 - Style Notion / Obsidian compact & élégant sans le //) */
.mention-note {
  @apply inline-flex items-center gap-1.5 bg-neutral-100/90 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/80 px-2 py-0.5 rounded-md cursor-pointer font-semibold text-[0.88em] hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm mx-0.5 select-none align-middle;
}

.mention-note::before {
  content: "📄";
  font-size: 0.9em;
  line-height: 1;
}

.mention-tag {
  @apply inline-flex items-center gap-1 bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/80 px-2 py-0.5 rounded-md cursor-pointer font-semibold text-[0.88em] hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 transition-all shadow-sm mx-0.5 select-none align-middle;
}

/* Code block lowlight */
.editor-container .ProseMirror pre {
  @apply bg-neutral-900 text-neutral-100 p-4 rounded-xl my-4 overflow-x-auto;
}

.editor-container .ProseMirror code {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
}

/* Sections restreintes dans l'éditeur (BRAIN-F10) */
.editor-container .ProseMirror [data-restricted="true"] {
  @apply border-l-4 border-amber-500 pl-3 bg-amber-50/60 dark:bg-amber-950/30 relative rounded-r-lg py-1.5 my-1.5;
}
.editor-container .ProseMirror [data-restricted="true"]::before {
  content: "🔒 Section restreinte (masquée au public)";
  @apply block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1 select-none;
}
</style>

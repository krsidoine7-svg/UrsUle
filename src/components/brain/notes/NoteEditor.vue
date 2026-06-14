<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
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
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Link as LinkIcon, Hash,
  Brackets
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  jsonValue?: any
  readOnly?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'update:jsonValue', 'save'])

const notesStore = useNotesStore()
const lowlight = createLowlight(common)

const TagMention = Mention.extend({
  name: 'tagMention'
})

const editor = useEditor({
  editable: !props.readOnly,
  content: props.jsonValue || props.modelValue || '',
  extensions: [
    StarterKit.configure({
      codeBlock: false, // On utilise CodeBlockLowlight à la place
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: 'Commence à écrire... utilise [[ pour lier une note, # pour un tag',
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

// Mettre à jour le contenu si on change de note de l'extérieur
watch(() => props.jsonValue, (newVal) => {
  if (editor.value && newVal && JSON.stringify(editor.value.getJSON()) !== JSON.stringify(newVal)) {
    // Éviter la boucle infinie si c'est l'éditeur qui a émis le changement
    editor.value.commands.setContent(newVal, { emitUpdate: false })
  }
}, { deep: true })

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
  clearTimeout(saveTimeout)
})
</script>

<template>
  <div class="note-editor-wrapper flex flex-col h-full bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
    
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

      <button @click="addLink()" :class="{ 'is-active': editor.isActive('link') }" class="toolbar-btn" title="Lien">
        <LinkIcon class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().insertContent('[[').run()" class="toolbar-btn text-primary-600 font-bold" title="Lien vers une note">
        <Brackets class="w-4 h-4" />
      </button>
      <button @click="editor.chain().focus().insertContent('#').run()" class="toolbar-btn text-blue-500 font-bold" title="Tag">
        <Hash class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-white editor-container">
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

/* Mentions */
.mention-note {
  @apply bg-primary-100 text-primary-800 px-1 rounded-sm cursor-pointer font-medium hover:bg-primary-200 transition-colors;
}

.mention-tag {
  @apply bg-blue-100 text-blue-800 px-1 rounded-sm cursor-pointer font-medium hover:bg-blue-200 transition-colors;
}

/* Code block lowlight */
.editor-container .ProseMirror pre {
  @apply bg-neutral-900 text-neutral-100 p-4 rounded-xl my-4 overflow-x-auto;
}

.editor-container .ProseMirror code {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
}
</style>

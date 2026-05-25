<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import { Markdown } from 'tiptap-markdown'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare,
  Code,
  Terminal,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Code2
} from 'lucide-vue-next'

interface Props {
  modelValue: string | object
  placeholder?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Décris ta tâche ici... (Markdown supporté)',
  readonly: false
})

const emit = defineEmits(['update:modelValue', 'change', 'update:json'])

const isMarkdownMode = ref(false)
const rawContent = ref('')

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    CharacterCount,
    Markdown,
  ],
  editable: !props.readonly,
  onUpdate: ({ editor }) => {
    const markdown = (editor.storage as any).markdown.getMarkdown()
    const json = editor.getJSON()
    emit('update:modelValue', markdown)
    emit('update:json', json)
    emit('change', markdown)
    rawContent.value = markdown
  },
})

// Sync from parent
watch(() => props.modelValue, (value) => {
  if (!editor.value || isMarkdownMode.value) {
    if (isMarkdownMode.value) rawContent.value = value as string
    return
  }
  
  const currentMarkdown = (editor.value.storage as any).markdown.getMarkdown()
  if (currentMarkdown === value) return

  editor.value.commands.setContent(value as string, { emitUpdate: false })
})

const toggleMarkdownMode = () => {
  if (isMarkdownMode.value) {
    // Switch back to Tiptap
    editor.value?.commands.setContent(rawContent.value, { emitUpdate: true })
  } else {
    // Switch to Raw Markdown
    rawContent.value = (editor.value?.storage as any).markdown.getMarkdown() || ''
  }
  isMarkdownMode.value = !isMarkdownMode.value
}

const handleRawInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  rawContent.value = value
  emit('update:modelValue', value)
  emit('change', value)
}

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL du lien', previousUrl)

  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="rich-text-editor border border-neutral-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-600/20 transition-all">
    <!-- Toolbar -->
    <div v-if="!readonly" class="toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 p-1.5 bg-neutral-50/50 border-b border-neutral-200 backdrop-blur-sm">
      <!-- Groupe 1: Texte -->
      <div class="flex items-center gap-0.5 pr-1.5 border-r border-neutral-200">
        <button 
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('heading', { level: 1 }) }]"
          title="Titre 1"
        >
          <Heading1 class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('heading', { level: 2 }) }]"
          title="Titre 2"
        >
          <Heading2 class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('heading', { level: 3 }) }]"
          title="Titre 3"
        >
          <Heading3 class="h-4 w-4" />
        </button>
      </div>

      <div class="flex items-center gap-0.5 px-1.5 border-r border-neutral-200">
        <button 
          @click="editor?.chain().focus().toggleBold().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('bold') }]"
          title="Gras"
        >
          <Bold class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleItalic().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('italic') }]"
          title="Italique"
        >
          <Italic class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleStrike().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('strike') }]"
          title="Barré"
        >
          <Strikethrough class="h-4 w-4" />
        </button>
      </div>

      <!-- Groupe 2: Listes -->
      <div class="flex items-center gap-0.5 px-1.5 border-r border-neutral-200">
        <button 
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('bulletList') }]"
          title="Liste à puces"
        >
          <List class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('orderedList') }]"
          title="Liste numérotée"
        >
          <ListOrdered class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleTaskList().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('taskList') }]"
          title="Checklist"
        >
          <CheckSquare class="h-4 w-4" />
        </button>
      </div>

      <!-- Groupe 3: Insertion -->
      <div class="flex items-center gap-0.5 px-1.5 border-r border-neutral-200">
        <button 
          @click="editor?.chain().focus().toggleCode().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('code') }]"
          title="Code inline"
        >
          <Code class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleCodeBlock().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('codeBlock') }]"
          title="Bloc code"
        >
          <Terminal class="h-4 w-4" />
        </button>
        <button 
          @click="setLink"
          :class="['tool-btn', { 'is-active': editor?.isActive('link') }]"
          title="Lien"
        >
          <LinkIcon class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().toggleBlockquote().run()"
          :class="['tool-btn', { 'is-active': editor?.isActive('blockquote') }]"
          title="Citation"
        >
          <Quote class="h-4 w-4" />
        </button>
      </div>

      <!-- Groupe 4: Actions -->
      <div class="flex items-center gap-0.5 px-1.5 border-r border-neutral-200">
        <button 
          @click="editor?.chain().focus().undo().run()"
          class="tool-btn"
          title="Annuler"
        >
          <Undo class="h-4 w-4" />
        </button>
        <button 
          @click="editor?.chain().focus().redo().run()"
          class="tool-btn"
          title="Refaire"
        >
          <Redo class="h-4 w-4" />
        </button>
      </div>

      <!-- Markdown Toggle -->
      <div class="ml-auto">
        <button 
          @click="toggleMarkdownMode"
          class="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
          :class="{ 'bg-primary-100 text-primary-600': isMarkdownMode }"
          title="Mode Markdown brut"
        >
          <Code2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-body">
      <textarea
        v-if="isMarkdownMode"
        v-model="rawContent"
        @input="handleRawInput"
        class="w-full min-h-[150px] p-4 font-mono text-sm border-none focus:ring-0 outline-none resize-y"
        :placeholder="placeholder"
      ></textarea>
      <EditorContent 
        v-else
        :editor="editor" 
        class="prose prose-sm max-w-none p-4 min-h-[150px]"
      />
    </div>

    <!-- Bottom Bar (Character Count) -->
    <div v-if="editor && !readonly" class="px-4 py-1 border-t border-neutral-100 flex justify-end">
      <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        {{ editor.storage.characterCount.characters() }} caractères
      </span>
    </div>
  </div>
</template>

<style scoped>
.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #737373; /* neutral-500 */
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background-color: #f5f5f5; /* neutral-100 */
  color: #171717; /* neutral-900 */
}

.tool-btn.is-active {
  background-color: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.rich-text-editor :deep(.tiptap) {
  outline: none;
}

.rich-text-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #a3a3a3; /* neutral-400 */
  float: left;
  height: 0;
  pointer-events: none;
  content: attr(data-placeholder);
}

/* Tiptap Task List Styles */
.rich-text-editor :deep(ul[data-type="taskList"]) {
  list-style: none;
  padding: 0;
}

.rich-text-editor :deep(ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.rich-text-editor :deep(ul[data-type="taskList"] input[type="checkbox"]) {
  margin-top: 0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
}

.rich-text-editor :deep(ul[data-type="taskList"] li > div) {
  flex: 1;
}
</style>

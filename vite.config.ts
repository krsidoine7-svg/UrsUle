import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('tiptap') || id.includes('prosemirror')) return 'editor'
            if (id.includes('lucide-vue-next')) return 'icons'
            if (id.includes('date-fns')) return 'date-utils'
            if (id.includes('radix-vue') || id.includes('@radix-ui')) return 'ui'
            return 'vendor'
          }
        }
      }
    }
  }
})

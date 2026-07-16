import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth.store'
import { appUpdateService } from '@/services/appUpdate.service'
import './assets/main.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  
  app.use(pinia)
  
  const authStore = useAuthStore()
  await authStore.initialize()
  
  // Initialisation de la détection de mise à jour PWA/SW
  appUpdateService.init()
  
  app.use(router)
  app.mount('#app')
}

bootstrap()

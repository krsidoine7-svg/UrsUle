import { watch } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface SEOMetadata {
  title?: string
  description?: string
  canonicalUrl?: string
}

/**
 * Met à jour dynamiquement les balises SEO (Title, Description, Open Graph, Twitter Card, Canonical)
 * lors de la navigation dans la PWA Vue 3.
 */
export function updateSEOMetadata(meta: SEOMetadata, routePath = '/'): void {
  if (typeof window === 'undefined') return

  const siteName = 'UrsUle'
  const defaultDesc = "Gestionnaire d'agenda, de tâches, de projets et second cerveau intelligent, intuitif et gamifié."
  
  const fullTitle = meta.title ? `${meta.title} | ${siteName}` : `${siteName} — Ta Productivité, Ta Réussite`
  const desc = meta.description || defaultDesc
  const url = `https://ursule.app${routePath}`

  // 1. Titre du document
  document.title = fullTitle

  // Helper pour mettre à jour ou créer une balise meta
  const setMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attrName, attrValue)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  // 2. Meta Description
  setMeta('meta[name="description"]', 'name', 'description', desc)

  // 3. Open Graph
  setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
  setMeta('meta[property="og:description"]', 'property', 'og:description', desc)
  setMeta('meta[property="og:url"]', 'property', 'og:url', url)

  // 4. Twitter Card
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc)

  // 5. Canonical URL
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  if (!canonicalEl) {
    canonicalEl = document.createElement('link')
    canonicalEl.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalEl)
  }
  canonicalEl.setAttribute('href', meta.canonicalUrl || url)
}

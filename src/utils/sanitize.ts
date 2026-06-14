import DOMPurify from 'dompurify'

/**
 * Assainit une chaîne de caractères HTML (ex: provenant de Tiptap)
 * pour éviter les vulnérabilités XSS (Cross-Site Scripting).
 * @param html String contenant du HTML brut
 * @returns String contenant du HTML nettoyé
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'br', 'span', 'div', 'code', 'pre', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'input'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'type', 'checked', 'data-type'],
  })
}

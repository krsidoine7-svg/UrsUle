<!-- Dernière mise à jour : 2026-07-16 -->
# Erreurs Vue 3, Tiptap et Routage — Solutions Validées

**Lien fourtour de référence :** [fourtour/2026-07-16_session-004.md](../../fourtour/2026-07-16_session-004.md)

---

## 1. [ERR-TIPTAP-01] Éditeur blanc et figé au clic sur une note (Race condition Tiptap)

### Symptôme
Lorsqu'un utilisateur sélectionne une note dans `NoteListView.vue` (ou `BrainView.vue`), le composant `NoteEditor.vue` s'ouvre mais reste vide/blanc, impossible de taper dedans, et la barre d'outils est inactive.

### Cause
L'initialisation de `useEditor` de `@tiptap/vue-3` est asynchrone lors du montage initial. La référence `editor.value` vaut `undefined` sur le premier cycle de rendu. Si l'on écoute uniquement un `watch(() => props.modelValue, ...)` ou `props.jsonValue`, ce watcher s'exécute ou s'interrompt avant que l'éditeur ne soit prêt à recevoir `setContent()`.

### Solution
1. **Ajouter `editor.value` dans les dépendances du `watch` :**
   ```ts
   watch(
     () => [props.jsonValue, props.modelValue, editor.value],
     ([newJson, newHtml, currentEditor]) => {
       if (!currentEditor) return
       // Vérifier et injecter le contenu si différent de currentEditor.getHTML()
     },
     { immediate: true, deep: true }
   )
   ```
2. **Définir le hook `onCreate` directement dans `useEditor` :**
   ```ts
   const editor = useEditor({
     // ...
     onCreate({ editor }) {
       if (props.jsonValue || props.modelValue) {
         editor.commands.setContent(props.jsonValue || props.modelValue, false)
       }
     }
   })
   ```

---

## 2. [ERR-ROUTER-01] Composant `<router-view>` qui ne se rafraîchit pas entre deux sous-routes

### Symptôme
En naviguant dans `BrainView.vue` d'une sous-route à une autre (ex: `/brain/notes` à `/brain/notes/:id` ou entre deux dossiers), l'affichage reste figé sur la vue précédente.

### Cause
Vue Router réutilise par défaut la même instance de composant lorsque les routes partagent le même composant parent ou layout si aucune clé unique ne distingue le composant dynamique du `<router-view>`.

### Solution
Toujours attacher la propriété `:key="route.fullPath"` au `<component :is="Component" />` dans `<router-view>` :
```html
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" :key="route.fullPath" />
  </transition>
</router-view>
```

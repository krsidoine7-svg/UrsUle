# 🧠 AGENTS.md — Mémoire & Règles Architecturales d'UrsUle

Ce fichier contient les règles d'ingénierie et bonnes pratiques spécifiques au projet **UrsUle**, apprises lors des résolutions de bugs et sessions de développement antérieures. **Tout agent ou développeur travaillant sur ce dépôt doit impérativement respecter ces directives.**

---

## 1. ✍️ Tiptap & Vue 3 (`useEditor`) : Réactivité et Prévention des Race Conditions
* **Problème identifié** : Lors de l'utilisation de `useEditor` de `@tiptap/vue-3`, l'objet `editor.value` est `undefined` lors des premiers cycles de rendu du composant, car Tiptap monte de manière asynchrone. Un simple `watch` sur les props (`modelValue` ou `jsonValue`) peut s'exécuter avant que `editor.value` ne soit prêt, laissant l'éditeur vide et figé.
* **Règle obligatoire** :
  1. Toujours inclure `editor.value` comme dépendance dans le `watch` : `watch(() => [props.jsonValue, props.modelValue, editor.value], ...)` avec l'option `{ immediate: true, deep: true }`.
  2. Toujours définir le hook `onCreate({ editor })` directement dans la configuration de `useEditor` pour initialiser le contenu initial si les props sont déjà disponibles au moment exact du montage du moteur.

---

## 2. 🔀 Vue Router & Transitions (`<router-view>`)
* **Problème identifié** : Lorsque plusieurs sous-routes partagent un même layout ou composant parent dynamique (e.g. dans `BrainView.vue` lors du passage d'une note à une autre ou d'un dossier à un autre), Vue 3 réutilise l'instance existante si aucune clé unique n'est fournie, ce qui empêche le rafraîchissement visuel et bloque l'affichage.
* **Règle obligatoire** :
  Dans tous les `<router-view>` dynamiques susceptibles d'afficher des éléments distincts du même type ou lors de transitions rapides, toujours attacher la clé `:key="route.fullPath"` :
  ```html
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
  ```

---

## 3. 🎨 Ergonomie UI, Troncatures et Accessibilité
* **Infobulles (`title`)** : Tout élément textuel utilisant des classes de troncature CSS (`truncate`, `line-clamp-*`) doit obligatoirement inclure un attribut `:title="valeur_entiere"` afin d'assurer l'accessibilité du contenu complet au survol de la souris.
* **Hauteurs des cartes (Grilles)** : Éviter les hauteurs fixes rigides (`h-40`, etc.) sur les cartes contenant du texte variable ou des listes de tags. Préférer des contraintes minimales (`min-h-[10rem] h-auto`) combinées à `line-clamp` pour préserver un équilibre harmonieux.

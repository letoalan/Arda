# Shim ESM MapLibre — `maplibre-shim.ts`

Ce module fournit un pont de compatibilité ESM pour MapLibre GL JS en exposant explicitement les méthodes et classes comme exports nommés (`addProtocol`, `removeProtocol`, `Map`, `Marker`, etc.) à partir de l'instance par défaut.

Il permet notamment à des bibliothèques externes telles que `maplibre-proj` (qui consomment `import { addProtocol, removeProtocol } from 'maplibre-gl'`) de fonctionner sans conflit sous Node.js, Vitest et les environnements de packaging ESM.

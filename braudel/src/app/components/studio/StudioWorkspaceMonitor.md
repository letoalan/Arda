# Documentation — Atelier de Cadrage & Source (`StudioWorkspaceMonitor.tsx`)

Composant d'affichage de l'**Écran 1 (Gauche)** en Mode Studio (architecture régie bi-écran). Permet à l'utilisateur de manipuler et zoomer librement sur l'instance cartographique MapLibre ou d'inspecter les médias sources importés.

---

## 1. Rôle et Fonctionnalités

### Cadrage Cartographique Interactif
- Laisse transparaître le canevas MapLibre sous-jacent (`pointer-events: none` sur le fond, `pointer-events: auto` sur les barres d'outils).
- **Indicateurs Caméra en Temps Réel** : Affiche les coordonnées GPS de centrage (latitude, longitude), le niveau de zoom, le bearing (rotation) et le pitch (inclinaison 3D).
- **Bouton `[🎯 Enregistrer Cadrage]`** : Capture les propriétés de la caméra active (`map.getCenter()`, `map.getZoom()`, `map.getBearing()`, `map.getPitch()`) et les enregistre dans l'attribut `mapState` du clip sélectionné, avec normalisation automatique à 180° pour le fond Al-Idrisi lorsque la caméra est alignée vers le Sud.
- **Bouton `[🔄 Réinit]`** : Replace instantanément la caméra sur le cadrage mémorisé d'origine du clip.
- **Outils Spécifiques Al-Idrisi (`🧭 180° Sud`)** :
  - **Badge d'Orientation Historique** : Notifie en en-tête et en pied d'écran que la carte médiévale Al-Idrisi est orientée avec le Sud en haut.
  - **Bouton `[🧭 180° Sud]`** : Permet de réaligner la carte vers le Sud en un clic (`map.rotateTo(180)`), restaurant la projection historique après toute manipulation interactive ou pivot de caméra.


### Inspection des Médias Sources (Images / Vidéos)
- Lorsqu'un clip de type `'image'` ou `'video'` est sélectionné dans la timeline, un calque plein écran recouvre la carte pour afficher le média source natif, son titre et sa durée.

---

## 2. Dépendances

- `lucide-react` : Icônes d'action (`Crosshair`, `RotateCcw`, `Compass`, `ImageIcon`, `VideoIcon`).
- `studio-types.ts` : Typage des clips (`VideoClip`).
- Parent : [`StudioTimeline.tsx`](./StudioTimeline.md).

---

## 3. Fil d'Ariane

[app/](../../app.md) -> [components/](../components.md) -> [studio/](./studio.md) -> **StudioWorkspaceMonitor.md**

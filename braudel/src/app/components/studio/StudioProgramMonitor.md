# Documentation — Moniteur Programme WYSIWYG (`StudioProgramMonitor.tsx`)

Composant d'affichage de l'**Écran 2 (Droite)** en Mode Studio (architecture régie bi-écran). Il affiche le rendu direct, fidèle et exhaustif du montage vidéo à l'instant de la tête de lecture (`playheadMs`).

---

## 1. Rôle et Spécifications

### Format 16:9 Natif & Letterboxing
- Conteneur strict au ratio 16:9 (`aspectRatio: '16/9'`) reproduisant la géométrie exacte du format Full HD d'export vidéo.
- **Plans Cartographiques** : Miroir direct haute fidélité du canevas MapLibre via un canevas 2D relais (`map.getCanvas()`) calé sur le cadrage de la scène.
- **Images Externes** : Affichage centré (`objectFit: 'contain'`) sur fond noir `#0a0e1a`.
- **Vidéos Externes** : Balise `<video>` asservie au timecode et synchronisée avec l'état de lecture (`isPlaying`).
- **Silence Vidéo (Gap)** : Rendu d'un écran noir cinématique lorsque la tête de lecture se situe sur un espace vide entre clips.

### Incrustation du Cartouche Cinématique
- Cartouche translucide en bas à gauche de l'écran affichant :
  - Le numéro de période et son type (`PÉRIODE #1`, `IMAGE`, `VIDÉO`).
  - L'époque temporelle formatée (`An 1500` ou `500 av. J.-C.`).
  - **Badge d'Orientation Historique** (`🧭 Sud en haut (1154)`) : Affiché automatiquement lorsque le plan utilise le fond médiéval islamique Al-Idrisi ou possède un bearing proche de 180°.
  - Le titre de la scène ou du média.
  - La liste des entités géographiques actives avec pastilles de couleur.
- Bouton de bascule `[👁️ Cartouche ON/OFF]` pour prévisualiser la vidéo brute sans incrustation.

### Guides de Cadrage & Sécurité (Safe Zones)
- Bouton `[📐 Repères]` affichant les cadres pointillés standard :
  - Action-Safe (90%)
  - Title-Safe (80%)
  - Réticule central de visée.

---

## 2. Dépendances

- `lucide-react` : Icônes (`Tv`, `Layers`, `Grid`, `Columns`, `Square`).
- `studio-types.ts` : Typage des clips (`VideoClip`).
- `entity.ts` : Typage des entités géographiques (`Entity`).
- Parent : [`StudioTimeline.tsx`](./StudioTimeline.md).

---

## 3. Fil d'Ariane

[app/](../../app.md) -> [components/](../components.md) -> [studio/](./studio.md) -> **StudioProgramMonitor.md**

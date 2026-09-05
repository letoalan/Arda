# Documentation — Opérations de Montage Timeline (`timeline-editor-actions.ts`)

Ce module implémente les opérations fondamentales de montage vidéo et audio pour le Mode Studio : découpage (Split), rognage temporel non destructif (Crop In / Out), et gestion du presse-papiers (Copier, Couper, Coller).

---

## 1. Fonctions Principales

| Fonction | Rôle |
|:---|:---|
| `splitClipAtTime(timeline, clipId, splitTimeMs)` | Scinde un clip sélectionné (vidéo ou audio) en deux parties à l'horodatage exact du playhead, avec calcul des offsets de trim |
| `copyClip(timeline, clipId)` | Extrait une copie d'un clip (vidéo ou audio) pour le presse-papiers Studio |
| `cutClip(timeline, clipId)` | Extrait un clip dans le presse-papiers et le retire de la timeline avec auto-résolution des collisions |
| `pasteClip(timeline, playheadMs, clipboardItem)` | Colle le clip à la position courante du curseur de lecture avec réindexation d'ID unique |
| `applyCropTemporal(clip, newTrimStartMs, newTrimEndMs)` | Calcule la durée effective et met à jour les bornes d'entrée et de sortie sans altérer la source |

---

## 2. Intégrité Temporelle

- **Préservation non destructive** : Pour les vidéos et audios avec durée source, `trimStartMs` et `trimEndMs` délimitent la fenêtre d'écoute/visionnage sans tronquer le fichier d'origine.
- **Résolution automatique** : Tout collage ou déplacement sur la piste vidéo principale passe par `resolveTrackOverlaps` pour prévenir les chevauchements involontaires.

---

## 3. Fil d'Ariane

[services/](../services.md) -> [export/](./export.md) -> **timeline-editor-actions.md**

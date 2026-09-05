# Documentation — Planificateur Temporel (`TimelineScheduler.ts`)

Le composant `TimelineScheduler` traduit le plan de montage `EditTimeline` en une séquence ordonnée d'instructions temporisées pour la caméra MapLibre et le mixage sonore Web Audio lors de la prévisualisation et de l'export vidéo.

---

## 1. Rôle et Responsabilités

- **Résolution automatique des collisions (`resolveTrackOverlaps`)** : sur la piste vidéo principale (track 0), garantit qu'aucun clip n'en chevauche un autre. Les décalages chronologiques sont résolus automatiquement sans perte d'information.
- **Requête spatio-temporelle (`getVideoClipAtTime`)** : localise instantanément quel clip vidéo / cadrage caméra correspond à la position du playhead (`timeMs`), avec support d'un paramètre optionnel `strict = false` pour distinguer les clips effectifs des gaps (silences vidéo).
- **Synchronisation audio multi-pistes (`scheduleAudioTracks`)** : programme avec une précision millimétrique les nœuds `AudioBufferSourceNode` et `GainNode` connectés au compositeur audio, en appliquant les fondus d'entrée/sortie (`fadeInMs`, `fadeOutMs`) et les niveaux de gain individuels.
- **Conversion en étapes d'animation (`buildScheduledVideoSteps`)** : calcule les durées effectives de déplacement caméra (`travelDurationMs`) et de pause narrative stabilisée (`pauseAfterMs`) pour chaque période à partir des durées personnalisées de l'utilisateur, tout en relayant les types de médias (`mediaType: 'map' | 'image' | 'video'`), URLs et offsets de rognage (`trimStartMs`, `trimEndMs`).

---

## 2. Fil d'Ariane

[services/](../services.md) -> [export/](./export.md) -> **TimelineScheduler.md**

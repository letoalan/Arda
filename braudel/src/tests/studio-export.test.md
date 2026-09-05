# Documentation — Tests Mode Studio & Montage Multi-Pistes (`studio-export.test.ts`)

Ce fichier de tests unitaires et d'intégration valide le fonctionnement rigoureux du modèle de données `EditTimeline`, du planificateur `TimelineScheduler`, du module de traitement audio `audio-import.ts` et du pipeline d'export enrichi `video-export.ts`.

---

## 1. Cas de Tests Couverts

### Modèle `EditTimeline` & Types Studio
- Conversion par défaut d'un `StoryProject` en `EditTimeline` avec clips séquentiels sur la piste 0.
- Validation des schémas Zod (`VideoClipSchema`, `AudioClipSchema`, `EditTimelineSchema`).
- Recalcul dynamique de la durée globale (`computeTotalTimelineDuration`) au maximum des extrémités temporelles vidéo et audio.

### Planificateur Temporel (`TimelineScheduler`)
- Résolution automatique des collisions et chevauchements de clips sur la même piste (`resolveTrackOverlaps`).
- Requête du clip vidéo actif par timestamp (`getVideoClipAtTime`) pour le scrubbing live.
- Filtrage des clips audio actifs (`getActiveAudioClipsAtTime`) selon la fenêtre temporelle et l'état muet (`muted`).
- Génération des étapes de caméras temporisées avec durées personnalisées (`buildScheduledVideoSteps`).
- Programmation des sources audio avec rampes de gain et contrôle d'arrêt global (`scheduleAudioTracks`).

### Traitement & Prévisualisation Audio (`audio-import`)
- Calcul de la forme d'onde par échantillonnage de crêtes normalisées (`computeWaveformData`).
- Dessin sur Canvas 2D (`drawWaveformOnCanvas`) avec distinction de progression.
- Pré-écoute interactive avec respect du volume et des fondus (`playAudioPreview`).

### Intégration Export Vidéo
- Prise en compte de l'`EditTimeline` dans l'estimation de durée `estimateVideoDuration`.
- Présence des codecs Opus (`vp9,opus`, `vp8,opus`) en tête de `CODEC_CASCADE`.
- Contrôle du seuil d'intégrité `MIN_VALID_BLOB_SIZE`.

---

## 2. Fil d'Ariane

[tests/](./tests.md) -> **studio-export.test.md**

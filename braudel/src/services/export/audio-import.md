# Documentation — Module Audio & Import (`audio-import.ts`)

Ce service assure le chargement, le décodage, l'analyse d'amplitudes et la pré-écoute des fichiers sonores (musique et voix off) pour le mode Studio de Braudel.

---

## 1. Fonctionnalités Principales

- **Décodage Web Audio natif** : prise en charge des formats audio MP3, WAV, OGG et AAC via `AudioContext.decodeAudioData`.
- **Extraction de forme d'onde (Waveform)** : algorithme de fenêtrage d'échantillons calculant l'amplitude absolue maximale pour produire un profil normalisé de 80 à 100 crêtes.
- **Rendu Canvas 2D ultra-rapide** : fonction `drawWaveformOnCanvas` dessinant des barres symétriques arrondies style DAW / CapCut avec indication en temps réel de la progression de lecture.
- **Édition non destructive** : préservation des données sources audio ; les opérations de découpage temporel (`trimStartMs`, `trimEndMs`) et de gain/fondu (`volume`, `fadeInMs`, `fadeOutMs`) sont appliquées dynamiquement par programmation de nœuds `GainNode`.
- **Prévisualisation interactive** : fonction `playAudioPreview` permettant d'écouter les pistes individuellement ou synchronisées avec la tête de lecture.

---

## 2. API et Méthodes

- `getSharedAudioContext()` : singleton réutilisant un contexte audio actif ou résolu.
- `computeWaveformData(buffer: AudioBuffer, numSamples?: number): number[]` : extrait le tableau de crêtes normalisées.
- `drawWaveformOnCanvas(ctx, waveform, width, height, options)` : tracé de la forme d'onde.
- `importAudioFile(file: File, ctx?: AudioContext)` : lit le `File`, le décode en `AudioBuffer` et génère le DataURL.
- `createAudioClipFromFile(file: File, type?, startMs?, ctx?)` : construit un `AudioClip` complet.
- `playAudioPreview(clip, buffer, startOffsetMs, onEnded?, ctx?)` : lance la lecture prévisualisée et retourne `{ stop }`.

---

## 3. Fil d'Ariane

[services/](../services.md) -> [export/](./export.md) -> **audio-import.md**

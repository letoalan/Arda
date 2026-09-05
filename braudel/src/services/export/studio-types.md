# Documentation — Types & Schémas du Mode Studio (`studio-types.ts`)

Ce module définit le modèle de données pivot **`EditTimeline`** utilisé par le mode Studio de type CapCut pour l'édition et l'assemblage temporel des vidéos cartographiques.

---

## 1. Rôle dans l'Architecture

Le modèle `EditTimeline` se positionne en passerelle entre le récit narratif (`StoryProject`) et le moteur d'enregistrement vidéo (`video-export.ts`) :

```
StoryProject (scènes séquentielles)
        │
        ▼ createDefaultEditTimeline()
EditTimeline (multi-pistes: videoTracks, audioTracks, durées étendues)
        │
        ▼
video-export.ts (capture canvas MapLibre + mixage audio MediaStream)
```

---

## 2. Structures de Données

### `VideoClip`
Représente un segment vidéo ou une période cartographique sur la timeline :
- `id` : identifiant unique du clip.
- `sceneId` : référence vers la `StoryScene` associée (optionnel pour les médias externes).
- `trackIndex` : indice de la piste (0 = piste principale des périodes).
- `startMs` : temps de départ en millisecondes sur la timeline globale.
- `durationMs` : durée du clip en millisecondes (modifiable à volonté indépendamment du profil narratif).
- `periodNumber` & `totalPeriods` : repères chronologiques pour la légende vidéo.
- `timelineYear` : date historique pour le positionnement de la carte.
- `mapState` & `transition` : cadrage caméra et paramètres de transition.
- `mediaType` : `'map'` (scène cartographique), `'image'` (image externe importée), ou `'video'` (clip vidéo importé).
- `mediaUrl` : URL de données (Data URL ou Blob URL) pour l'affichage de médias externes.
- `sourceDurationMs` : durée totale originale du fichier vidéo ou de la source.
- `trimStartMs` & `trimEndMs` : offsets de rognage temporel non destructif (Crop In / Crop Out).
- `name` : intitulé ou nom de fichier du média.

### `AudioClip`
Représente un échantillon sonore synchronisé :
- `id` : identifiant unique.
- `name` : nom du fichier sonore.
- `type` : `'music'` (fond musical) ou `'voice'` (voix off / narration).
- `trackIndex` : indice de piste audio.
- `startMs` : point d'entrée temporel sur la timeline globale.
- `durationMs` : durée active du clip sur la timeline.
- `sourceDurationMs` : durée totale de la source sonore non découpée.
- `trimStartMs` & `trimEndMs` : offsets de découpage non destructif.
- `volume` : gain sonore (0.0 à 1.0 ou au-delà).
- `fadeInMs` & `fadeOutMs` : rampes de fondu d'entrée et de sortie.
- `muted` : coupure son unitaire.
- `waveformData` : profil d'amplitude normalisé (pics 0 à 1) pour le tracé graphique de la forme d'onde.
- `audioBuffer` : `AudioBuffer` Web Audio décodé en mémoire.

### `EditTimeline`
Le plan de montage complet :
- `id` : identifiant du projet de montage.
- `videoTracks` : collection des clips vidéo ordonnés.
- `audioTracks` : collection des clips audio synchronisés.
- `totalDurationMs` : durée globale de l'export (maximum des extrémités des clips).
- `zoomScale` : échelle d'affichage de la timeline (pixels par seconde).
- `playheadMs` : position du curseur de lecture en millisecondes.

---

## 3. Fonctions Utilitaires

- `createDefaultEditTimeline(story: StoryProject): EditTimeline` : convertit les scènes d'un récit en une timeline multi-piste continue, tout en garantissant la préservation du cap canonique d'orientation (notamment 180° Sud en haut pour le style `al_idrisi` via `getEffectiveStyleBearing`).
- `getSceneDefaultDurationMs(scene: StoryScene): number` : évalue la durée initiale d'une scène selon son mode de transition (fixe ou auto).
- `computeTotalTimelineDuration(timeline: EditTimeline): number` : recalcule dynamiquement la durée globale au maximum des fins de clips.

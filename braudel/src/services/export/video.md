# Spécification et Fonctionnalités du Format de Sortie Vidéo (`video.md`)

## 1. Rôle et Vision
Le format de sortie vidéo d'Arda / Braudel permet de générer de façon entièrement automatisée une **animation cartographique continue et cinématique** à partir des scènes narratives d'un monde. 

Contrairement aux exports statiques (PDF, JPEG unitaire) ou aux séquences d'images (Collection JPEG ZIP), la sortie vidéo capture en temps réel les trajectoires de caméra, les variations d'échelle, les rotations et l'évolution dynamique des entités historiques au fil de la frise chronologique.

---

## 2. Caractéristiques Techniques du Format

| Paramètre | Valeur Standard | Description |
| :--- | :--- | :--- |
| **Conteneur** | `.webm` (ou `.mp4`) | Format ouvert web (`.webm`), basculant automatiquement sur `.mp4` si Safari/iOS l'exige. |
| **Codec Vidéo** | **VP9** (avec cascade de repli) | Négociation dynamique automatique : teste en priorité `video/webm;codecs=vp9`, puis `vp8`, `h264`, `webm` générique, puis le codec par défaut du navigateur. Évite toute exception `DOMException: unsupported codec`. |
| **Cadence (Framerate)** | **30 FPS** (standard) / 60 FPS (optionnel) | Fluidité optimale lors des mouvements de caméra (`flyTo`, `easeTo`). |
| **Résolution** | **Native** (1920×1080 Full HD, 1440p, 4K) | Déterminée directement par les dimensions du viewport WebGL, sans étirement ni déformation de ratio d'aspect. |
| **Mode de Capture** | `HTMLCanvasElement.captureStream(fps)` | Enregistrement direct depuis le framebuffer GPU via l'API standard `MediaRecorder`. |
| **Segmentation** | Tranches de 100 ms | Évite toute saturation mémoire lors des récits comportant de nombreuses scènes. |

---

## 3. Fonctionnalités Cartographiques Embarquées

### A. Orchestration des Transitions Caméra
- **Trajectoires cinématiques fluides** : Utilisation des fonctions de vol de MapLibre GL (`flyTo`, `easeTo`, `jumpTo`).
- **Contrôle de la durée et de la vitesse** : Vitesse adaptative calculée selon la distance géodésique parcourue (`profile: 'cinematic'` ou `standard`).
- **Respect de l'orientation et de la perspective** :
  - Préservation du cap (`bearing`) : maintient l'angle historique (ex: **180° Sud en haut** pour la carte médiévale Al-Idrisi).
  - Préservation de l'inclinaison (`pitch`) : permet des vues obliques 3D dynamiques lors des survols de reliefs ou massifs montagneux.
- **Politique de mouvement pour l'export** (`reduceMotionPolicy: 'essential-for-export'`) : Les transitions sont forcées lors de la génération vidéo, même si l'accessibilité du système hôte est configurée sur `prefers-reduced-motion`.

### B. Synchronisation Spatio-Temporelle
- À chaque scène, le moteur synchronise la timeline (`setCurrentTime(timelineYear)`).
- Les entités, frontières territoriales et flux relationnels apparaissent, évoluent et disparaissent au moment précis de l'arrivée sur l'époque cible.
- **Temps de pause pédagogique** (`pauseAfterMs: 800` par défaut) : stabilise la vue sur le territoire pour permettre la lecture des étiquettes et des données avant le décollage vers l'étape suivante.

### C. Stabilisation Pré-Enregistrement
- Appel de `waitForMapIdle(map, 2000)` avant le lancement du `MediaRecorder` pour garantir que le fond de carte initial et les données vectorielles de départ sont 100% chargés avant la première image enregistrée.

---

## 4. Comparatif des Formats de Sortie

| Usage | Vidéo WebM (`.webm`) | Collection JPEG ZIP (`.zip`) | Atlas PDF (`.pdf`) |
| :--- | :--- | :--- | :--- |
| **Nature** | Fichier vidéo unique animé | Série d'images HD séquentielles | Document vectoriel multi-pages |
| **Objectif** | Diffusion immédiate / projection | Montage vidéo sur logiciel externe | Impression, lecture et archivage |
| **Contrôle du rythme** | Prédéfini par le Story Editor | 100% libre dans Premiere / DaVinci | Manuel (tourne-page) |
| **Animations caméra** | Enregistrées en direct | Recréées en post-production (Ken Burns) | N/A (planches fixes) |
| **Son / Voix-off** | Ajoutable en post-prod | Mixage aisé sur timeline vidéo | N/A |

---

## 5. Compatibilité et Exploitation

- **Lecteurs média directs** : VLC, mpv, Windows Media Player (avec codecs WebM), QuickTime (via convertisseur ou composant tiers).
- **Navigateurs Web** : Prise en charge native complète sur Chrome, Edge, Firefox, Safari (balise standard `<video src="recit.webm" controls>`).
- **Logiciels de Montage** :
  - **DaVinci Resolve** : Support natif ou conversion ProRes / DNxHR.
  - **Adobe Premiere Pro** : Import natif (avec plugin WebM ou transcodage rapide MP4).
  - **Shotcut / CapCut / Kdenlive / Blender VSE** : Import natif immédiat.
- **Plateformes d'hébergement** : Compatible YouTube, Vimeo, Mastodon, Bluesky et plateformes e-learning.

---

## 6. Dépendances et Fichiers Liés

- **Implémentation TypeScript** : [`video-export.ts`](./video-export.ts)
- **Orchestration caméra** : [`../cartography/camera-orchestrator.ts`](../cartography/camera-orchestrator.ts)
- **Schéma de données Story** : [`../../core/schema/story.ts`](../../core/schema/story.ts)
- **Composant IHM déclencheur** : [`../../app/components/data/ExportMultimediaSection.tsx`](../../app/components/data/ExportMultimediaSection.tsx)

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **video.md**

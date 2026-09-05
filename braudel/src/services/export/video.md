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
| **Mode de Capture** | **Canvas 2D Relais** (`recordCanvas.captureStream`) synchronisé sur `requestAnimationFrame` | Élimine tout conflit de lecture directe sur le buffer WebGL MapLibre, évitant définitivement les erreurs `WebGL context was lost`. Assure une alimentation vidéo continue et produit un fichier vidéo complet et volumineux. |
| **Segmentation** | Tranches régulières de 250 ms | Équilibre optimal entre réactivité du flux et stabilité d'encodage pour le codec. |

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

## 4. Compteurs d'Avancement et Évaluation de la Tâche

Pour garantir une expérience utilisateur transparente et prévisible lors de la génération de vidéos potentiellement longues, le pipeline vidéo intègre un système d'évaluation préalable et un **double compteur en temps réel** :

### A. Évaluation Préalable de la Tâche (`estimateVideoDuration`)
Avant tout déclenchement de l'enregistrement, le moteur analyse le projet de récit et calcule :
- **Nombre total de scènes/plans** à enregistrer.
- **Durée totale estimée** de la vidéo finale : calculée à partir de la somme des durées de vol (`durationMs` ou 2,2s par défaut) et des pauses d'observation (`pauseAfterMs: 800ms`), plus le temps de pré-stabilisation.
- **Résolution native** exacte du viewport WebGL (ex: 1920×1080).
- **Codec vidéo compatible** détecté automatiquement (`VP9`, `VP8`, `H.264`, etc.).

### B. Compteur 1 : Rendu & Génération Cartographique (Capture en direct)
Pendant l'animation de la caméra et des entités sur l'écran :
- **Jauge de progression cartographique** (0% → 100%).
- **Index de scène et intitulé** : ex: *Scène 3 / 5 — Époque An 1154 (Al-Idrisi)*.
- **Chronomètre dynamique** : affichage en temps réel du **temps écoulé** (`elapsedMs`) et du **temps restant estimé** (`estimatedRemainingMs`).

### C. Compteur 2 : Encodage Vidéo GPU & Assemblage Final
L'encodage vidéo par le compresseur matériel du navigateur (`MediaRecorder`) s'exécute **en continu et en parallèle** de la saisie cartographique :
- **Démarrage immédiat** : Dès la réception de la première tranche de 100 ms émise par `ondataavailable`, la jauge violette s'anime en direct (1% → 90%), reflétant la compression progressive des images par le GPU/codec (`chunkCount / estimatedTotalChunks`).
- **Télémétrie en direct** : Affichage en continu du débit binaire mesuré (ex: `2.4 Mbps`), du nombre de fragments encodés et du volume de données.
- **Phase d'Assemblage & Post-Traitement** : À la fin du parcours des scènes, le compteur effectue l'assemblage final des buffers (90% → 100%), indexe les métadonnées de durée et génère le fichier conteneur WebM / MP4 sans latence ni gel à 0%.

---

## 5. Comparatif des Formats de Sortie

| Usage | Vidéo WebM (`.webm`) | Collection JPEG ZIP (`.zip`) | Atlas PDF (`.pdf`) |
| :--- | :--- | :--- | :--- |
| **Nature** | Fichier vidéo unique animé | Série d'images HD séquentielles | Document vectoriel multi-pages |
| **Objectif** | Diffusion immédiate / projection | Montage vidéo sur logiciel externe | Impression, lecture et archivage |
| **Contrôle du rythme** | Prédéfini par le Story Editor | 100% libre dans Premiere / DaVinci | Manuel (tourne-page) |
| **Animations caméra** | Enregistrées en direct | Recréées en post-production (Ken Burns) | N/A (planches fixes) |
| **Son / Voix-off** | Ajoutable en post-prod | Mixage aisé sur timeline vidéo | N/A |

---

## 6. Compatibilité et Exploitation

- **Lecteurs média directs** : VLC, mpv, Windows Media Player (avec codecs WebM), QuickTime (via convertisseur ou composant tiers).
- **Navigateurs Web** : Prise en charge native complète sur Chrome, Edge, Firefox, Safari (balise standard `<video src="recit.webm" controls>`).
- **Logiciels de Montage** :
  - **DaVinci Resolve** : Support natif ou conversion ProRes / DNxHR.
  - **Adobe Premiere Pro** : Import natif (avec plugin WebM ou transcodage rapide MP4).
  - **Shotcut / CapCut / Kdenlive / Blender VSE** : Import natif immédiat.
- **Plateformes d'hébergement** : Compatible YouTube, Vimeo, Mastodon, Bluesky et plateformes e-learning.

---

## 7. Dépendances et Fichiers Liés

- **Implémentation TypeScript** : [`video-export.ts`](./video-export.ts)
- **Modale d'export dédiée** : [`../../app/components/data/ExportVideoModal.tsx`](../../app/components/data/ExportVideoModal.tsx)
- **Éditeur Studio multi-pistes (CapCut-like)** : [`../../app/components/studio/StudioTimeline.tsx`](../../app/components/studio/StudioTimeline.tsx)
- **Modèle de timeline enrichie** : [`studio-types.ts`](./studio-types.ts)
- **Importation et formes d'ondes audio** : [`audio-import.ts`](./audio-import.ts)
- **Planificateur temporel & synchronisation** : [`TimelineScheduler.ts`](./TimelineScheduler.ts)
- **Orchestration caméra** : [`../cartography/camera-orchestrator.ts`](../cartography/camera-orchestrator.ts)
- **Schéma de données Story** : [`../../core/schema/story.ts`](../../core/schema/story.ts)
- **Composant IHM déclencheur** : [`../../app/components/data/ExportMultimediaSection.tsx`](../../app/components/data/ExportMultimediaSection.tsx)

## 8. Mode Studio & Montage Multi-Pistes (CapCut-like)

Le mode Studio permet de manipuler la timeline des périodes en amont de l'exportation :
- **Durées personnalisées par période** : extension/réduction en millisecondes par manipulation directe des bords des blocs.
- **Importation de médias externes (Images & Vidéos)** : insertion de fichiers PNG/JPEG/WebP/SVG ou MP4/WebM peints directement sur le canevas 2D relais pendant leur fenêtre temporelle avec préservation des proportions.
- **Crops temporels universels (In / Out)** : rognage non destructif des vidéos, cartes et audios via `trimStartMs` et `trimEndMs`.
- **Opérations de montage professionnelles** : Scission (`Split` au playhead), Copier, Couper, Coller sur la timeline avec résolution automatique des chevauchements.
- **Pistes audio synchronisées** : importation de fichiers MP3/WAV/OGG, tracé de la forme d'onde, réglage de volume unitaire, fondus d'entrée/sortie (`fadeIn`, `fadeOut`) et découpage non destructif (`trim`).
- **Mixage temps réel** : les flux audio Web Audio sont mixés avec le canevas vidéo relais dans un `MediaStream` unique transmis à l'encodeur VP9/Opus.
- **Scrubbing interactif** : curseur de lecture (playhead) synchronisé en continu avec la carte MapLibre.

## 9. Fiabilisation et Garde-fous (implementation-video.md)

Le pipeline vidéo intègre 7 niveaux de protection pour prévenir la génération de fichiers vides ou corrompus, implémentés suite au diagnostic de [`implementation-video.md`](../../implementation-video.md) :

| # | Garde-fou | Mécanisme |
|:---|:---|:---|
| 1 | **Instrumentation de diagnostic** | Logs horodatés `[Video Export]` à chaque étape critique du pipeline |
| 2 | **Garde-fou dimensions canvas** | Attente bloquante jusqu'à `width > 0 && height > 0` (timeout 5 s) + validation piste `readyState` |
| 3 | **Validation première frame** | Échantillonnage de pixels pour détecter les frames 100% noires/fond initial |
| 4 | **Vérification codec réel** | Mini-enregistrement de test (300 ms, canvas 64×64) avant l'export complet |
| 5 | **Timer proportionnel** | `min(15s, max(3s, durée × 0.5))` + délai 200 ms post-`requestData()` |
| 6 | **Validation Blob** | Rejet si `blob.size < 1024` octets — aucun fichier corrompu téléchargé |
| 7 | **Retour IHM explicite** | Modale d'erreur rouge avec message détaillé + bouton de relance FPS réduit |

---

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **video.md**

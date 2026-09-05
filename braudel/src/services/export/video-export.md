# Documentation — Export Vidéo WebM (`video-export.ts`)

Pour la spécification complète des fonctionnalités, caractéristiques techniques (VP9, 30 FPS, capture de flux WebGL) et comparatifs d'usage avec les formats d'images, se référer au document de référence :

👉 **[Spécification et Fonctionnalités du Format de Sortie Vidéo (`video.md`)](./video.md)**

## Rôle et Responsabilités
`video-export.ts` implémente la fonction **`exportStoryToWebM`** :
- Capture le flux du canvas MapLibre GL en temps réel via un **Canvas 2D Relais** synchronisé sur `requestAnimationFrame`.
- Enregistre la vidéo au format standard **WebM avec codec VP9** (ou repli automatique VP8 / H.264 / MP4) via l'API `MediaRecorder`.
- Pré-stabilise le rendu cartographique via `waitForMapIdle(map, 2000)`.
- Itère sur chaque scène du récit (`story.scenes`), déplace la timeline (`timelineYear`), et joue la transition orchestrée (`playSceneTransition`) avec priorité absolue sur les animations (`essential-for-export`).
- Déclenche le téléchargement automatique du fichier `.webm` résultant.

## Fonctions et Exports Principaux

| Fonction / Constante | Rôle |
|:---|:---|
| `exportStoryToWebM()` | Pipeline complet d'export vidéo avec Canvas 2D Relais, synchronisation d'entités et mixage audio |
| `exportEditTimelineToWebM()` | Version enrichie pilotée par le plan de montage `EditTimeline` (durées personnalisées et pistes audio) |
| `drawVideoLegend()` | Dessine le cartouche cinématique translucide de légende par-dessus la carte (période, date, pastilles d'entités) |
| `drawRoundedRect()` | Utilitaire géométrique cross-platform pour le tracé de rectangles arrondis dans tout contexte Canvas 2D |
| `verifyAndCapturePeriodEntities()` | Algorithme de vérification de présence des entités vectorielles et de capture confirmée des trames par période |
| `VideoExportOptions` | Interface d'options (entités, relations, callback synchrone `updateEntities`, minFrames, `includeLegend`, `timeline`, `audioBuffersMap`) |
| `estimateVideoDuration()` | Évaluation préalable de la durée et du nombre de plans (avec prise en compte d'un `EditTimeline`) |
| `getSupportedVideoMimeType()` | Détection déclarative du meilleur codec navigateur |
| `verifyCodecSupport(mimeType)` | **Test réel d'enregistrement** (300 ms, canvas 64×64) pour valider un codec |
| `getVerifiedMimeType()` | Cascade complète avec vérification réelle de chaque codec |
| `CODEC_CASCADE` | Liste ordonnée des 8 codecs candidats (VP9 → MP4) |
| `MIN_VALID_BLOB_SIZE` | Seuil minimal (1 024 octets) pour qu'un Blob vidéo soit considéré valide |
| `VideoExportProgress` | Interface de progression avec double compteur, période courante et décompte d'entités vérifiées |

## Garde-fous et Fiabilisation (implementation-video.md & Correctif Écran Noir)

Le pipeline intègre des niveaux de protection contre la génération de fichiers vidéo vides ou à écran noir :

1. **Rattachement au DOM (Offscreen)** : Pour que les moteurs Chromium et Firefox composent les frames d'un canvas capturé avec `captureStream()`, `recordCanvas` est rattaché au `document.body` (positionné en `fixed; left: -99999px; width: 1px; height: 1px; opacity: 0; pointer-events: none`). Il est retiré proprement dans le bloc `finally`.
2. **Synchronisation directe sur `map.on('render')`** : Pour éviter que `ctx.drawImage` ne lise un buffer WebGL vidé par le swap de tampons du navigateur, la copie est hookée directement sur l'événement synchrone `'render'` de MapLibre GL, capturant l'image immédiatement après l'émission des commandes GPU.
3. **Notification explicite du flux (`track.requestFrame()`)** : À chaque frame copiée, la piste vidéo est expressément notifiée pour forcer l'encodeur matériel à enregistrer la frame courante.
4. **Rafraîchissement initial forcé (`map.triggerRepaint()`)** : Avant le démarrage de l'enregistrement, un repaint forcé est émis pour garantir que la première frame WebGL est peinte et que `framesCopied > 0`.
5. **Instrumentation de diagnostic** : Logs horodatés `[Video Export]` à chaque étape critique (dimensions canvas, état piste, chunks reçus, résolution onstop vs timer).
6. **Garde-fou dimensions du canevas** : Attente bloquante (`waitForCanvasReady`) jusqu'à ce que `mapCanvas.width > 0 && height > 0` (timeout 5 s).
7. **Vérification robuste du codec** : Mini-enregistrement de test (`verifyCodecSupport`) avant l'export réel pour exclure les faux positifs de `isTypeSupported()`.
8. **Timer de sécurité proportionnel** : `Math.min(15000, Math.max(3000, totalDurationMs * 0.5))` au lieu d'un délai fixe.
9. **Délai post-requestData** : 200 ms entre `requestData()` et `stop()` pour laisser le dernier chunk être émis.
10. **Validation post-assemblage du Blob** : Si `finalBlob.size < MIN_VALID_BLOB_SIZE` (1 Ko), l'export est considéré comme échoué et aucun fichier corrompu n'est téléchargé.
11. **Double buffer 2D contre les rémanences d'overlay (`cleanMapCanvas`)** : Un buffer hors-champ conserve la carte pure sans aucun texte. À chaque frame, `composeVideoFrame()` réécrit 100% de la surface avant d'apposer la légende courante, évitant tout fantôme d'anciennes légendes plus hautes.
12. **Résilience Codecs Audio-Vidéo Multi-Pistes (`CODEC_CASCADE_AUDIO` & `CODEC_CASCADE_VIDEO_ONLY`)** : Pour éliminer les erreurs `DOMException: MediaRecorder.start: An audio track cannot be recorded: video/webm;codecs=vp8 indicates an unsupported codec` (notamment sur Firefox), la détection et les tests de codecs (`verifyCodecSupport`, `getVerifiedMimeType`) distinguent formellement les flux comprenant une piste audio (`CODEC_CASCADE_AUDIO` exigeant `opus` ou le conteneur générique `video/webm`) des flux vidéo purs (`CODEC_CASCADE_VIDEO_ONLY`). De plus, un bloc de rattrapage en cascade sur `recorder.start(250)` bascule automatiquement vers les codecs de repli en cas d'incompatibilité signalée à l'exécution.
13. **Garantie de Complétude Temporelle, Cadrages et Audio (`requiredTotalDurationMs`)** :
    - **Top départ Web Audio synchronisé** : `scheduleAudioTracks` est invoqué précisément lors du premier tick de `MediaRecorder.start(250)`, annulant la dérive temporelle causée par la pré-stabilisation WebGL initiale.
    - **Maintien de la durée par plan** : Pour chaque scène (dont la dernière), une boucle d'attente active pulse `composeVideoFrame()` et `triggerTrackFrame()` jusqu'à atteindre l'intégralité de `step.durationMs` défini sur la timeline.
    - **Buffer outro et achèvement de bande sonore (+1.2s)** : Le calcul `requiredTotalDurationMs = Math.max(totalVideoPlannedMs, maxAudioPlannedMs) + 1200` stabilise le cadrage de la dernière carte à l'écran pendant que la musique ou la narration termine son fondu sans troncature abrupte.
    - **Cadrages fins préservés en mode statique** : `selectOptimalTransitionType` prend en compte `deltaBearing` et `deltaPitch`, et force `map.jumpTo` pour que les cartes orientées (ex: Sud en haut Al-Idrisi ou vue 3D inclinée) conservent rigoureusement leur cadrage.
14. **Élimination de l'Anamorphose et Standardisation 16:9 Full HD (`resolveTargetVideoDimensions`)** :
    - La vidéo produite est verrouillée par défaut au standard **16:9 Full HD (1920 × 1080)** (ou 9:16 Vertical, 1:1 Carré selon l'option choisie).
    - Pour éliminer l'élongation de la sphère terrestre (+25,5 % verticalement) observée lors de captures depuis un écran partagé Studio (ex. 960 × 688), `updateCleanMapBuffer()` et `composeVideoFrame()` appliquent un calcul homothétique exact `scale = Math.min(width / mapCanvas.width, height / mapCanvas.height)` avec `scaleX === scaleY` centré sur fond `#070b14`. La sphéricité du globe est 100% préservée sans aplatissement ni écrasement.
15. **Maintien Universel du Cap 180° Al-Idrisi (`getEffectiveStyleBearing`)** :
    - Dans la boucle d'export vidéo, chaque diapositive/période voit son orientation normalisée par `getEffectiveStyleBearing(scene.mapState?.basemapStyle || options?.basemapStyle, scene.mapState?.bearing)` avant `playSceneTransition`, garantissant que 100% des diapositives conservent l'orientation Sud historique de la cartographie islamique médiévale.

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **video-export.md**

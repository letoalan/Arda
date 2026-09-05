# Documentation — Modale d'Export Vidéo (`ExportVideoModal.tsx`)

## Rôle
`ExportVideoModal.tsx` est le composant React responsable de l'interface utilisateur d'export vidéo. Il orchestre :
- L'**évaluation préalable** de la tâche vidéo (durée estimée, nombre de scènes, détection et durée des pistes audio, cadrages 2D/3D garantis, résolution, codec détecté).
- Le choix du **framerate** (30 FPS recommandé / 60 FPS ultra fluide).
- L'option d'**incrustation cinématique de la légende cartographique** (période, date, entités actives colorées).
- Le suivi en temps réel via le **double compteur** (saisie cartographique + encodage GPU).
- La **garantie de complétude du projet** (maintien du plan final et achèvement du son sans coupure).
- Le **bilan de complétude validé** en fin d'export (`done`) et le **retour utilisateur explicite en cas d'échec** (`error`).

## États de la Modale

| Phase | Affichage |
|:---|:---|
| `idle` | Évaluation préalable (durée, scènes, piste audio, cadrages caméra, résolution choisie, codec) + **liste ordonnée des périodes avec paramètres de cadrage précis (`Z`, `Cap`, `Tilt`, badge « 🧭 Sud (180°) » pour Al-Idrisi, badge « Plan final »)** + **sélecteur de format et ratio d'aspect (`16:9 Paysage 1920×1080`, `9:16 Vertical 1080×1920`, `1:1 Carré 1080×1080`) avec badge « Sphéricité 1:1 garantie »** + sélecteur FPS + toggle incrustation légende + bandeau « Garantie de complétude » + bouton « Démarrer » |
| `stabilizing` | Double compteur actif, barre bleue en progression |
| `capturing` | Double compteur actif, sous-étapes en direct (période courante `Période X/N`, chrono, débit Mbps, **badge de vérification des entités capturées**, notification de maintien du plan final et fondu audio) |
| `encoding` | Barre violette, assemblage final, badge « ASSEMBLAGE FINAL » |
| `done` | Badge « FINALISÉ » vert + **encadré d'audit « Complétude du Projet Validée à 100% »** détaillant les plans, le cadrage final, la piste sonore mixée et la taille du fichier |
| `error` | **Encadré rouge** avec icône `AlertTriangle`, message d'erreur détaillé, conseils de résolution et **bouton « Réessayer »** à FPS réduit |

## Garde-fou Utilisateur (Étape 7 — implementation-video.md)

En cas de phase `error` (typiquement un Blob de taille nulle détecté après assemblage), la modale affiche :
1. Un **bandeau rouge** avec le message d'erreur précis (`videoProgress.statusMessage` ou `subStepMessage`).
2. Des **conseils de résolution** : vérifier le codec, réduire le FPS, consulter les logs `[Video Export]` en F12.
3. Un **bouton de relance automatique** qui réduit le FPS de moitié (minimum 15 FPS) et relance l'export.

L'utilisateur n'est **jamais** confronté à un téléchargement silencieux de fichier vide.

## Props

| Prop | Type | Description |
|:---|:---|:---|
| `isOpen` | `boolean` | Visibilité de la modale |
| `worldName` | `string` | Nom du monde (titre de la vidéo) |
| `story` | `StoryProject` | Projet de récit avec scènes et transitions |
| `canvasDimensions` | `{ width, height }` | Dimensions du viewport WebGL |
| `isExporting` | `boolean` | État d'export en cours |
| `videoProgress` | `VideoExportProgress \| null` | Progression détaillée du pipeline |
| `onStartExport` | `(fps: number, includeLegend?: boolean, resolution?: '1080p' \| '720p' \| 'vertical_1080p' \| 'square_1080p') => Promise<void>` | Callback de démarrage avec options et format vidéo |
| `onOpenStudio` | `(() => void) \| undefined` | Callback d'ouverture de l'éditeur de timeline Studio (CapCut-like) |
| `onClose` | `() => void` | Callback de fermeture |

## Dépendances
- [`video-export.ts`](../../../services/export/video-export.ts) : `estimateVideoDuration`, `getSupportedVideoMimeType`, `VideoExportProgress`
- [Lucide React](https://lucide.dev/) : `X`, `Video`, `Clock`, `Film`, `Layers`, `Play`, `CheckCircle2`, `Cpu`, `AlertTriangle`, `RotateCcw`

## Fil d'Ariane
[app/](../../app.md) -> [components/](../components.md) -> [data/](./data.md) -> **ExportVideoModal.md**

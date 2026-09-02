# Documentation — Modale d'Export Vidéo (`ExportVideoModal.tsx`)

## Rôle
`ExportVideoModal.tsx` est le composant React responsable de l'interface utilisateur d'export vidéo. Il orchestre :
- L'**évaluation préalable** de la tâche vidéo (durée estimée, nombre de scènes, résolution, codec détecté).
- Le choix du **framerate** (30 FPS recommandé / 60 FPS ultra fluide).
- L'option d'**incrustation cinématique de la légende cartographique** (période, date, entités actives colorées).
- Le suivi en temps réel via le **double compteur** (saisie cartographique + encodage GPU).
- Le **retour utilisateur explicite en cas d'échec** (encadré rouge, message d'erreur détaillé, bouton de relance).

## États de la Modale

| Phase | Affichage |
|:---|:---|
| `idle` | Évaluation préalable (durée, scènes, résolution, codec) + **liste ordonnée des périodes séquencées dans la timeline** (`Période 1/N`) + sélecteur FPS + **toggle incrustation légende** + bouton « Démarrer » |
| `stabilizing` | Double compteur actif, barre bleue en progression |
| `capturing` | Double compteur actif, sous-étapes en direct (période courante `Période X/N`, chrono, débit Mbps, **badge de vérification des entités capturées**) |
| `encoding` | Barre violette, assemblage final, badge « ASSEMBLAGE FINAL » |
| `done` | Badge « FINALISÉ » vert + message de succès avec taille du fichier |
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
| `onStartExport` | `(fps: number, includeLegend?: boolean) => Promise<void>` | Callback de démarrage avec options |
| `onClose` | `() => void` | Callback de fermeture |

## Dépendances
- [`video-export.ts`](../../../services/export/video-export.ts) : `estimateVideoDuration`, `getSupportedVideoMimeType`, `VideoExportProgress`
- [Lucide React](https://lucide.dev/) : `X`, `Video`, `Clock`, `Film`, `Layers`, `Play`, `CheckCircle2`, `Cpu`, `AlertTriangle`, `RotateCcw`

## Fil d'Ariane
[app/](../../app.md) -> [components/](../components.md) -> [data/](./data.md) -> **ExportVideoModal.md**

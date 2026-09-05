# Secteur `src/services/export/` (Exportations Multimédias et Autonomes)

## Rôle du Secteur
Ce secteur regroupe les générateurs d'exportations aux différents formats pris en charge par Braudel : HTML autonome, Storyboard ZIP, PDF et vidéos WebM.

## Fichiers Principaux du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`standalone-template.ts`** | Template HTML de publication autonome | [standaloneExport.md](./standaloneExport.md) |
| **`standaloneScripts.ts`** | Script embarqué d'interaction et de navigation carte/récit | [standaloneExport.md](./standaloneExport.md) |
| **`standaloneStyles.ts`** | CSS embarqué pour publication autonome | [standaloneExport.md](./standaloneExport.md) |
| **`export-multimedia.ts`** | Façade d'exportation PDF normalisés A4, JPEG HD et captures chronologiques | [export-multimedia.md](./export-multimedia.md) |
| **`modules/`** | Sous-modules spécialisés (< 200 lignes) pour l'export cartographique et multimédia | [modules/modules.md](./modules/modules.md) |
| **`pdf-timeline-utils.ts`** | Utilitaires d'extraction polymorphe des époques et du point médian | [pdf-timeline-utils.md](./pdf-timeline-utils.md) |
| **`storyboard-export.ts`** | Génération de packs Zip storyboard (visuels HD, story.json, script.md) | [storyboard-export.md](./storyboard-export.md) |
| **`video-export.ts`** | Exportation vidéo cinématique WebM (VP9 30fps) avec transitions caméras | [video.md](./video.md) |
| **`studio-types.ts`** | Modèle de données `EditTimeline`, clips vidéo/audio et durées étendues | [studio-types.md](./studio-types.md) |
| **`audio-import.ts`** | Import, décodage Web Audio, calcul de forme d'onde et gestion des pistes audio | [audio-import.md](./audio-import.md) |
| **`media-import.ts`** | Importation d'images et vidéos externes, extraction de durée et conversion en clips | [media-import.md](./media-import.md) |
| **`TimelineScheduler.ts`** | Planificateur temporel, résolution de collisions et synchronisation multi-pistes | [TimelineScheduler.md](./TimelineScheduler.md) |
| **`timeline-editor-actions.ts`** | Opérations de montage Studio : Split au playhead, Crops temporels, Copier, Couper, Coller | [timeline-editor-actions.md](./timeline-editor-actions.md) |

## Fil d'Ariane
[services/](../services.md) -> **export/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

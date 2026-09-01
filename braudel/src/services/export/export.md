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
| **`video-export.ts`** | Exportation de vidéos commentées | - |

## Fil d'Ariane
[services/](../services.md) -> **export/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

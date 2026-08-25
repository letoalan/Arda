# Secteur `src/services/export/` (Exportations Multimédias et Autonomes)

## Rôle du Secteur
Ce secteur regroupe les générateurs d'exportations aux différents formats pris en charge par Braudel : HTML autonome, Storyboard ZIP, PDF et vidéos WebM.

## Fichiers Principaux du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`standalone-template.ts`** | Template HTML de publication autonome | [standaloneExport.md](./standaloneExport.md) |
| **`standaloneScripts.ts`** | Script embarqué d'interaction et de navigation carte/récit | [standaloneExport.md](./standaloneExport.md) |
| **`standaloneStyles.ts`** | CSS embarqué pour publication autonome | [standaloneExport.md](./standaloneExport.md) |
| **`export-multimedia.ts`** | Génération de documents PDF et captures chronologiques | - |
| **`storyboard-export.ts`** | Génération de packs Zip storyboard | - |
| **`video-export.ts`** | Exportation de vidéos commentées | - |

## Fil d'Ariane
[services/](../services.md) -> **export/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

# Documentation — Export Storyboard ZIP (`storyboard-export.ts`)

## Rôle et Responsabilités
`storyboard-export.ts` génère une archive ZIP complète destinée à la post-production, au montage vidéo et à l'archivage narratif :
- **Capture JPEG par Scène** (`visuals/scene_X_zY.jpg`) : Effectue une capture haute définition via `captureMapCanvas` après stabilisation et attente de l'état idle de la caméra. Utilise une composition 2D avec fond plein (blanc ou couleur de thème `--bg-primary`) pour éliminer définitivement tout artefact de fond noir lié à l'absence de canal alpha en JPEG.
- **Manifeste de Récit** (`story.json`) : Exportation structurée de l'objet `StoryProject` avec coordonnées de cadrage, zooms, dates de timeline et paramètres de transition.
- **Script Narration & Voix-Off** (`script.md`) : Document Markdown détaillant chaque scène avec son lien d'illustration, ses métadonnées géographiques et temporelles, ainsi que son texte d'accompagnement.
- **Crédits & Sources** (`credits.md`) : Mentions légales, plateforme Braudel, nom de l'univers et date d'export.
- **Documentation Wiki** (`wiki.md`) : Optionnellement inclus si des entités cartographiques comportent du contenu wiki documenté.

## Dépendances
- `jszip`
- `../../core/schema/story`
- `../cartography/camera-orchestrator` (`playSceneTransition`)
- `./modules/pdf-map-capture` (`captureMapCanvas`)

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> **storyboard-export.md**

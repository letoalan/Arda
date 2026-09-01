# ExportMultimediaSection.tsx

## Rôle
Section présentant l'ensemble des boutons de déclenchement des exports cartographiques et multimédias :
- **Atlas PDF** : Ouvre le modal de sélection d'époques pour générer un livret ou atlas A4 paysager.
- **Collection JPEG (ZIP)** : Déclenche l'exportation par lot de l'ensemble des époques ciblées sous forme d'images JPEG HD zippées (respecte le bearing Al-Idrisi 180° et le filtrage temporel strict).
- **Image JPEG HD** : Capture immédiate de la vue active courante.
- **HTML Autonome** : Exportation de l'application interactive Bento autonome.
- **Storyboard Pack** : Exportation du dossier de récit (visuels JPEG HD, story.json, script.md, credits.md), ciblant automatiquement les époques du monde.
- **Vidéo WebM** : Enregistrement vidéo animé continu des transitions de scènes (VP9 30fps).

## Emplacement
`src/app/components/data/ExportMultimediaSection.tsx`

## Dépendances Entrantes
- `DataPanel.tsx` (../../views/DataPanel.md)

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

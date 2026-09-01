# ExportZipModal.tsx

## Rôle
Modale ergonomique dédiée à la configuration et au téléchargement de la **Collection d'Images JPEG zippées**. Distincte de l'interface PDF, elle offre une expérience spécialisée pour l'exportation par lot de fichiers bitmap individuels :
- **Mode Vue Actuelle (1 image JPEG)** ou **Collection Multi-Époques (Archive ZIP)**.
- Clichés haute définition positionnés à l'instant médian de chaque époque (`targetYear`).
- Respect strict de l'orientation de la carte (notamment le bearing 180° Sud en haut pour Al-Idrisi).
- Génération d'un inventaire textuel `README.md` et d'un manifeste structuré `manifest.json` à la racine de l'archive ZIP.

## Emplacement
`src/app/components/data/ExportZipModal.tsx`

## Dépendances Entrantes
- `DataPanel.tsx` (../../views/DataPanel.md)

## Dépendances Sortantes
- `pdf-timeline-utils.ts` (../../../services/export/pdf-timeline-utils.md)

## Fonctionnalités Clés
- Sélecteur de périmètre (Vue Actuelle vs Collection Multi-Époques).
- Filtres rapides pour la sélection des époques : *« Importées »*, *« Tout »*, *« Aucun »*.
- Badge d'identification des époques ayant des apports réellement importés sur la carte.
- Barre de progression de compression animée.
- Bouton unique d'action clairement typé : *« Télécharger l'Archive ZIP (N images) »*.

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

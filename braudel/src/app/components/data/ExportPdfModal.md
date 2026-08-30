# ExportPdfModal.tsx

## Rôle
Modale ergonomique de configuration de l'exportation cartographique PDF. Elle permet à l'utilisateur de choisir entre l'exportation unitaire de la **période courante** (position actuelle du curseur temporel) ou la génération d'un **Atlas complet multi-époques** incluant toutes les époques où l'on trouve des apports (Géopolitica, entités et relations).

## Emplacement
`src/app/components/data/ExportPdfModal.tsx`

## Dépendances Entrantes
- `DataPanel.tsx` (../../views/DataPanel.md)

## Dépendances Sortantes
- `pdf-timeline-utils.ts` (../../../services/export/pdf-timeline-utils.md)

## Fonctionnalités Clés
- Sélecteur à double carte intuitive (*Période Courante* vs *Atlas Multi-Époques*).
- **Détection intelligente des époques importées** : Identification des époques ayant des fonds ou entités réellement présents sur la carte (badge vert distinctif `Importé`).
- **Filtres rapides** : Boutons d'action rapide *« Importées (N) »*, *« Tout »* et *« Aucun »*.
- Sélection ergonomique par ligne entière ou case à cocher (icônes vectorielles `CheckSquare` / `Square` sans conflit de propagation).
- Barre de progression animée lors de l'exportation multi-pages.


## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

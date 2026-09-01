# ExportPdfModal.tsx

## Rôle
Modale ergonomique de configuration de l'exportation cartographique multi-époques. Elle permet à l'utilisateur de choisir entre l'exportation unitaire de la **période courante** ou la génération d'une collection complète multi-époques sous deux formats au choix :
1. **Atlas PDF multi-pages A4 paysager** (`onConfirmMulti`).
2. **Collection d'Images JPEG zippées** (`onConfirmMultiZip`), chaque époque formant une planche HD distincte avec préservation stricte de l'orientation (Al-Idrisi 180° Sud en haut).

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
- **Export Hybride** : Boutons de déclenchement dédiés dans le pied de page pour *Images ZIP (N)* ou *Générer l'Atlas PDF*.
- Sélection ergonomique par ligne entière ou case à cocher (icônes vectorielles `CheckSquare` / `Square` sans conflit de propagation).
- Barre de progression animée lors de l'exportation multi-pages / multi-images.

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

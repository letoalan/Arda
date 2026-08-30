# EntityPanel.tsx

## Rôle
Panneau latéral de gestion et de recherche d'entités temporelles. Permet l'ajout rapide d'entités, l'édition de géométrie et le filtrage par période historique.

## Emplacement
`src/app/views/EntityPanel.tsx`

## Dépendances Entrantes
- `App.tsx` (../App.md)

## Dépendances Sortantes
- `store.ts` (../state/store.md)
- `EntityAddForm.tsx` (../components/entity/EntityAddForm.md)
- `EntityListItem.tsx` (../components/entity/EntityListItem.md)

## Fonctionnalités Clés
- Ajout, recherche et filtrage par période historique.
- Édition en ligne unifiée (`updateEntity`) : nom, type, couleur de remplissage/contour et bornes temporelles.
- Synchronisation réactive immédiate avec la carte WebGL et la frise chronologique.

## Secteur Parent
[views/](./views.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

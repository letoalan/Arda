# LayerPanel.tsx

## Rôle
Panneau latéral de gestion et de visualisation des couches (calques) du monde actif. Permet d'activer/désactiver la visibilité de chaque couche, de réordonner ou supprimer des couches, et d'ajouter de nouvelles couches (`physical`, `historical`, `political`).

## Emplacement
`src/app/views/LayerPanel.tsx`

## Dépendances Entrantes
- `MapView.tsx` (./MapView.md)

## Dépendances Sortantes
- `store.ts` (../state/store.md)
- `schema/layers.ts` (../../core/schema/layers.md)

## Prise en charge de la Couche Alpha
- **Badge d'identification** : Les couches disposant de `meta.isBaseLayer: true` ou de rang 0 / intitulées `(Alpha)` reçoivent un badge visuel distinctif `Alpha` / `Base Layer`.
- **Compteur d'entités** : Indique le nombre d'entités rattachées à la couche `(X entités)`.
- **Sécurité et intégrité** : La couche Alpha dispose d'une protection contre la suppression accidentelle avec alerte de confirmation explicite pour préserver l'ancrage des entités géopolitiques de base.

## Secteur Parent
[views/](./views.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

# EntityListItem

Composant représentant une entrée individuelle dans la liste des entités (panneau latéral).

## Rôle & Fonctionnalités
- Affichage de la pastille de couleur réactive avec sélecteur direct intégré (`<input type="color">`).
- Mode édition en ligne (nom, type, dates de début/fin, couleur).
- Outils de tracé vectoriel rapide (Point, Ligne, Polygone) et suppression.
- Support du callback `onChangeColor` pour répercussion instantanée sur le store et la carte MapLibre.

## Dépendances
- `EntityPanel.tsx`

# ReliefControlsSection.tsx

## Rôle
Composant de contrôle visuel des paramètres d'ombrage du relief (Hillshade) :
- Curseur d'exagération du relief borné strictement entre `0` et `1.0` (pas de 0.05) conformément aux contraintes de validation de MapLibre GL.
- Sélecteurs de couleur pour les zones d'ombre (`shadowColor`) et de lumière (`highlightColor`).
- Boutons d'application directe et presets prédéfinis (« Ombrage Doux » : 0.3, « Dramatique » : 0.95).

## Emplacement
`src/app/components/style/ReliefControlsSection.tsx`

## Dépendances Sortantes
- `lucide-react` (Wand2)

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md)

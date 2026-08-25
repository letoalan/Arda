# Plan d'implémentation : Refonte Géomorphologique des Vallées

Suite à l'analyse détaillée des limites de l'approche actuelle (cuvette plate, frontières dures, profondeur arbitraire), ce plan vise à remplacer la génération binaire des vallées par un modèle mathématique continu et physiquement réaliste.

## User Review Required

> [!IMPORTANT]
> **Extraction de l'axe médian (Squelettisation)**
> L'extraction d'un axe médian mathématiquement parfait à partir d'un polygone arbitraire dessiné à main levée est complexe en temps réel (nécessite un algorithme de Voronoï ou de Straight Skeleton). 
> *Approximation proposée* : Nous pouvons soit simplifier fortement le polygone, soit demander à l'utilisateur de dessiner les vallées sous forme de **Lignes** (comme les Rifts) avec une "largeur" associée, plutôt que des polygones. 
> → **Question** : Es-tu d'accord pour qu'on passe le type `valley` en géométrie `line` (ligne) dans l'acquisition, ce qui nous donne l'axe médian gratuitement et résout la question du profil longitudinal (début de la ligne = amont, fin = aval) ?

## Open Questions

1. **Interface Utilisateur** : Veux-tu que j'ajoute un toggle "Profil en V (Fluvial) / Profil en U (Glaciaire)" dans la barre d'outils quand l'utilisateur dessine une vallée, ou bien on le déduit de l'altitude environnante ?
2. **Type de géométrie** : Comme mentionné ci-dessus, passer de `polygon` à `line` pour les vallées simplifierait radicalement l'algorithme tout en garantissant un résultat parfait pour le profil longitudinal.

## Proposed Changes

### [MODIFY] [generateSyntheticDEM.ts](file:///C:/Users/alano/WebstormProjects/braudel/braudel/src/utils/generateSyntheticDEM.ts)
Refonte complète de la boucle de traitement des `valleys` :
- **Remplacement de `isPointInPolygon`** : Utilisation d'une fonction de distance au segment (SDF) pour calculer `distanceToAxis`.
- **Profil Transversal** : Implémentation des fonctions `getValleyProfile(distance, halfWidth, type)` pour les profils U et V.
- **Profil Longitudinal** : Interpolation de la largeur et de la profondeur maximale entre le point de départ (amont) et le point d'arrivée (aval).
- **Profondeur Relative** : Remplacement du plancher `Math.max(10, altitude)` par une contrainte de type `Math.min(computedDepth, baseElevation * 0.6)`.
- **Raccordement Doux** : Application de la fonction `smoothFalloff(t)` pour fondre les bords de la vallée dans le relief environnant.

### [MODIFY] [types.ts](file:///C:/Users/alano/WebstormProjects/braudel/braudel/src/acquisition/types.ts) *(Optionnel, sous réserve de validation)*
- Si validé, modification du mapping pour que `valley` devienne une géométrie de type `line` au lieu de `polygon`.

### [MODIFY] [ContinentBuilderView.tsx](file:///C:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/ContinentBuilderView.tsx)
- Ajout d'une option de sélection du profil (V ou U) dans la barre d'outils lorsque l'outil `valley` est actif.

## Verification Plan
1. **Tests Visuels** : Dessiner une vallée traversant un plateau montagneux et vérifier que les bords ne présentent plus de "marches d'escalier" mais une pente douce continue.
2. **Vérification Côtière** : Dessiner une vallée arrivant dans l'océan et s'assurer qu'elle ne creuse pas le fond marin de manière irréaliste (la contrainte relative bloquera le creusement à l'approche de l'altitude 0).
3. **Typologie** : Vérifier la différence de rendu entre un profil V et un profil U.

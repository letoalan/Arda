# Walkthrough : Palier 3bis (Refonte des Vallées)

L'algorithme de génération de vallées a été intégralement repensé pour coller à la réalité géomorphologique, comme convenu.

## Changements clés

1. **Géométrie en Ligne (`LineString`)**
   - L'outil de création de `valley` force désormais l'utilisateur à dessiner une ligne (comme pour les rifts) plutôt qu'un polygone.
   - Cela donne naturellement un "axe médian", avec un point de départ (amont) et d'arrivée (aval).

2. **Profil Transversal et Falloff (SDF)**
   - Le moteur ne teste plus si un pixel est "dedans ou dehors". Il calcule sa distance exacte au segment de ligne le plus proche (`distToSegmentSquared`).
   - Le creusement est maximal au centre de l'axe, et remonte progressivement vers les bords (`shapeDepthFactor = 1 - t`).
   - Un lissage cosinusoïdal (`smoothFalloff`) empêche toute "marche d'escalier" sur les bords de la vallée.

3. **Profil Longitudinal**
   - Le creusement varie le long du tracé : il est plus profond à la source (amont, `s=0`) et s'adoucit vers l'embouchure (aval, `s=1`) grâce au facteur `(1 - 0.4 * s)`.

4. **Creusement Relatif (Respect de l'environnement)**
   - L'altitude de la vallée n'est plus bridée à "+10m" par sécurité. 
   - Désormais, l'algorithme lit l'altitude du terrain sur lequel il se trouve (qui peut être une montagne de 3000m ou une côte à 50m), et limite son creusement à un maximum de **60% de cette altitude de base**. 
   - Une vallée près d'une plage ne creusera jamais sous l'eau. Une vallée en haute montagne formera un profond canyon.

## Résolution de l'ordre d'acquisition

> [!NOTE]
> Tu avais mentionné une contrainte critique : *"il faut prévoir que l'utilisateur trace le fleuve avant le relief, ce qui sous-tend une déformation adaptée a posteriori"*.

Cette contrainte est **résolue nativement par l'architecture du DEM** !
Le moteur de terrain `generateSyntheticDEM.ts` ne génère pas le monde dans l'ordre chronologique de tes clics. Il procède par passes géomorphologiques :
1. Élévation continentale de base
2. Application du bruit fractal
3. **Surélévation par les Montagnes et Collines**
4. **Creusement par les Vallées**

Puisque la passe des vallées intervient *toujours après* la passe des montagnes, l'algorithme lira toujours la hauteur finale de la montagne pour calculer ses "60% de creusement", **même si tu avais tracé la vallée sur ton écran avant de dessiner la montagne**. Ton fleuve traversera la nouvelle montagne avec grâce !

## Vérification
La compilation TypeScript s'exécute avec succès. Vous pouvez tester en superposant une montagne et une ligne de vallée dans l'interface.

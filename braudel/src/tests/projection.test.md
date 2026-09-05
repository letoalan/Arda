# Suite de Tests `projection.test.ts`

Ce fichier de tests valide l'ensemble des transformations géométriques, reconnaissances d'aspect ratio et reprojections de coordonnées de [`projection.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/projection.ts).

## Couverture des Tests

1. **`detectProjectionFromDimensions`** :
   - Détection de l'Équirectangulaire pour un ratio 2:1 (ex. 2048×1024).
   - Détection du Web Mercator pour un ratio 1:1 (ex. 1024×1024).
   - Retour `unknown` pour des dimensions non standard (ex. 1200×800).
2. **`Equirectangular Coordinate Transforms`** :
   - Projection du centre $(0, 0)$ au pixel central.
   - Roundtrip exact de coordonnées géographiques $(\text{lon/lat} \to \text{pixel} \to \text{lon/lat})$.
3. **`Web Mercator Coordinate Transforms`** :
   - Projection du centre $(0, 0)$ au pixel central.
   - Roundtrip de coordonnées avec bridage de latitude $\pm 85.05^\circ$.
4. **`Eckert IV Coordinate Transforms`** :
   - Projection $(0, 0)$ au centre exact du canevas $(W/2, H/2)$ au format canonique 2:1.
   - Roundtrip précis sur plusieurs continents (Paris, Tokyo, New York, Rio de Janeiro, Le Cap, Sydney).
   - Vérification de la signature fondamentale d'Eckert IV : la ligne polaire mesure exactement 50% de l'équateur ($L_{\text{pôle}} / L_{\text{équateur}} = 0.5$).
5. **`Reprojection between projections`** :
   - Reprojection `equirectangular` $\to$ `web-mercator`.
   - Reprojection `web-mercator` $\to$ `eckert4`.

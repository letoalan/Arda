# Module `projection.ts`

Le module [`projection.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/projection.ts) gère la reconnaissance, la projection et la reprojection géométrique des coordonnées et pixels cartographiques pour le système Arda.

## Projections Supportées (`MapProjectionType`)

1. **`web-mercator`** : Projection cylindrique conforme standard EPSG:3857 (ratio d'aspect 1:1, couramment utilisée pour les tuiles glissantes).
2. **`equirectangular`** : Projection cylindrique équidistante (Plate Carrée, ratio 2:1 standard pour les planisphères globaux).
3. **`orthographic`** : Projection perspective sphérique simulant la vue du globe terrestre depuis l'espace.
4. **`eckert4`** : **Projection pseudocylindrique équivalente d'Eckert IV (1906)**.

---

## Caractéristiques Mathématiques d'Eckert IV

La projection d'Eckert IV est conçue pour préserver rigoureusement les surfaces relatives de tous les pays et continents (équivalence) avec une géométrie fermée élégante :
- **Parallèles** : Droites horizontales parallèles inégalement espacées (resserrées vers les pôles).
- **Lignes polaires** : Droites horizontales dont la largeur mesure exactement la moitié de l'équateur :
  $$\frac{L_{\text{pôle}}}{L_{\text{équateur}}} = 0.5$$
- **Méridiens limites ($\pm 180^\circ$)** : Arcs semi-circulaires parfaits reliant les extrémités des pôles à l'équateur.
- **Ratio d'aspect global** : Exactement $2:1$ ($W = 2H$).

### Algorithme Direct (`geoToEckertIVPixel`)

Soit $\lambda$ la longitude et $\varphi$ la latitude en radians.
L'angle auxiliaire $\theta$ est déterminé en résolvant par la méthode de Newton-Raphson :
$$\theta + \sin\theta\cos\theta + 2\sin\theta = \left(2 + \frac{\pi}{2}\right)\sin\varphi$$
Convergence garantie en moins de 6 itérations avec précision $< 10^{-11}$.

Coordonnées cartésiennes :
$$X = \frac{2}{\sqrt{4\pi + \pi^2}} \cdot \lambda \cdot (1 + \cos\theta)$$
$$Y = 2 \sqrt{\frac{\pi}{4 + \pi}} \cdot \sin\theta$$

### Algorithme Inverse (`eckertIVPixelToGeo`)

À partir des coordonnées de pixel normalisées $(X_{\text{norm}}, Y_{\text{norm}}) \in [-1, 1]$ :
$$\theta = \arcsin(Y_{\text{norm}})$$
$$\lambda = \frac{X_{\text{norm}} \cdot 2 \cdot C_y}{C_x \cdot (1 + \cos\theta)}$$
$$\sin\varphi = \frac{\theta + \sin\theta\cos\theta + 2\sin\theta}{2 + \frac{\pi}{2}}$$
$$\varphi = \arcsin(\text{clamp}(\sin\varphi, -1, 1))$$

---

## Reprojection Multidirectionnelle (`reprojectPixel`)

Permet de convertir des coordonnées de pixels entre n'importe quelle paire de projections supportées :
- `equirectangular` $\leftrightarrow$ `web-mercator`
- `web-mercator` $\leftrightarrow$ `eckert4`
- `equirectangular` $\leftrightarrow$ `eckert4`

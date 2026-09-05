# Composant `EckertIVOverlay.tsx`

## Rôle & Fonctionnalités
Le composant [`EckertIVOverlay.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/components/map/EckertIVOverlay.tsx) projette un cadre géométrique d'enveloppe cartographique au-dessus de la carte lorsque la projection **Eckert IV 2D** est sélectionnée dans Arda.

## Caractéristiques Visuelles

1. **Silhouette Géométrique Canonique d'Eckert IV** :
   - Tracé vectoriel SVG au ratio d'aspect strict $2:1$.
   - Deux segments polaires horizontaux (Nord et Sud) mesurant chacun exactement la moitié de l'équateur ($L_{\text{pôle}} = \frac{1}{2} L_{\text{équateur}}$).
   - Deux arcs semi-elliptiques reliant les pôles à l'équateur (méridiens limites $\pm 180^\circ$).
2. **Masque d'Atlas Hors-Monde** :
   - Masque d'ombrage sombre semi-transparent (`fillRule="evenodd"`) délimitant l'espace hors-planisphère.
   - Double filet cyan/atlas avec halo lumineux (`url(#eckertGlow)`).
   - Repères pointillés pour l'Équateur, le Méridien Central de Greenwich, les Tropiques du Cancer (+23.44°) et du Capricorne (-23.44°), ainsi que les Cercles Polaires Arctique (+66.56°) et Antarctique (-66.56°), calculés fidèlement selon les équations trigonométriques d'Eckert IV.
3. **Alignement Conteneur Dynamique (`ResizeObserver`)** :
   - Assure une synchronisation géométrique absolue avec le canevas de la carte en mesurant `clientWidth` et `clientHeight` du conteneur parent au lieu de `window.innerWidth`, garantissant un centrage parfait même en présence de panneaux latéraux (StylePanel, StoryEditor).
4. **Badge Télémétrique HUD & Contrôles Option 2** :
   - Cartouche d'information en bas à droite indiquant la projection active, le ratio 2:1 et la conservation stricte des surfaces relatives.
   - Bouton `[🌍 Zoom Globe 3D]` permettant de plonger instantanément dans la vue Globe 3D avec tuilage haute résolution.
   - Bouton de recentrage `[⟲ Recentrer]` en cas de déplacement.
   - Bouton de masquage discret.

## Emplacement & Dépendances
- `src/app/components/map/EckertIVOverlay.tsx`
- Parent : `src/app/views/MapView.tsx`

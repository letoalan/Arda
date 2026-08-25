# Documentation — Vue Cartographique (`MapView.tsx`)

## Rôle & Responsabilité
`MapView.tsx` est le composant central de visualisation cartographique :
1. **Initialisation MapLibre & Multi-Monde** :
   - Mode Réel (Braudel) : Charge le fond vectoriel historique ou contemporain.
   - Mode Imaginaire (Tolkien / Arda) : Initialise le canevas de monde imaginaire et applique le rendu vectoriel des continents dessinés (`renderContinents`) avec surfaces continentales, traits de côte, lignes de crêtes et sommets.
2. **Effet de Flou & Synthèse Visuelle Progressive** :
   - Lorsque `mapLoading` est actif, un filtre CSS dynamique `blur((1 - progress) * 16px)` applique un flou dégressif jusqu'à révélation nette de la tuile cartographique.
3. **Synchronisation Climat & Relief** :
   - Mise à jour en temps réel des calottes glaciaires, submersions marines et ombrages du relief.

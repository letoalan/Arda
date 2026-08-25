# Documentation — Panneau Climat (`ClimatPanel.tsx`)

## Rôle & Responsabilité
`ClimatPanel.tsx` est le panneau latéral rétractable unifié de gestion environnementale et paléoclimatique :
1. Affiche l'anomalie de température instantanée $\Delta T^\circ$ interpolée selon l'année courante de la Timeline.
2. Aiguille dynamiquement l'interface interne vers `TolkienClimateView` (univers fantastiques) ou `BraudelClimateView` (histoire réelle et projections GIEC).
3. Fournit les toggles de rendu partagés pour l'affichage cartographique du niveau marin (en mètres) et des calottes glaciaires (en latitude limite).

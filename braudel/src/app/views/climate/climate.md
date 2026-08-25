# Documentation — Vues Climatiques (`src/app/views/climate/`)

## Rôle & Responsabilité
Ce dossier regroupe les interfaces de configuration climatique selon le mode de jeu :
- `TolkienClimateView.tsx` : Questionnaire à 5 contrôles (point de départ, tendance, intensité, vitesse, cause narrative) avec aperçu sparkline SVG.
- `BraudelClimateView.tsx` : Visualisation de la série historique (-3000 à 2026) et configuration prospective (slider médian +1 à +4°C ou ensemble multi-trajectoires RCP du GIEC).

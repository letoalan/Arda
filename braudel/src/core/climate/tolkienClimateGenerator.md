# Documentation — Générateur Climat Tolkien (`tolkienClimateGenerator.ts`)

## Rôle & Responsabilité
`tolkienClimateGenerator.ts` génère une série temporelle d'anomalies de températures pour les univers fictifs à partir de 5 questions narratives :
1. `startingPoint` : Point de départ climatique (`ice_age`, `temperate`, `warm`, `hyperthermal`).
2. `trend` : Direction générale (`cooling`, `stable`, `warming`, `erratic`).
3. `intensity` : Amplitude du changement (slider de 1 à 4).
4. `speed` : Vitesse de bascule (slider de 1 à 4).
5. `dominantCause` : Cause dominante narrative (`astronomical`, `volcanic`, `magical_industrial`, `oceanic_cycle`).

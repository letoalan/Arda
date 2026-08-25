# Documentation — Service Climat Braudel (`braudelClimateService.ts`)

## Rôle & Responsabilité
`braudelClimateService.ts` assemble les séries climatiques pour le Mode Braudel :
- `getHistoricalClimatePoints()` : Récupère la série paléoclimatique historique (-3000 à 2026).
- `getRcpScenarios()` : Expose les 4 projections RCP du GIEC.
- `buildBraudelClimateScenario(medianTarget, rcpKey, applyVolcanoes)` : Construit la séquence temporelle complète en raccordant le passé historique et le futur médian ou RCP choisi, avec prise en compte des anomalies volcaniques majeures.

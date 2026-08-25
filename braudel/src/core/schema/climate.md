# Documentation — Schéma Climat (`climate.ts`)

## Rôle & Responsabilité
`climate.ts` définit la structure des données climatiques pour la Version 1.1 :
- `climatePointSchema` : Point temporel associant une année (`year`) et une anomalie de température (`deltaTemp` en °C).
- `climateScenarioSchema` : Scénario complet (paléoclimat, projections RCP ou courbe Tolkien paramétrique).
- `climateSettingsSchema` : Préférences d'affichage (toggles niveau marin, calottes glaciaires, cible de réchauffement médian, variabilité RCP).

# Documentation — Vue Climat Braudel (`BraudelClimateView.tsx`)

## Rôle & Responsabilité
`BraudelClimateView.tsx` permet le paramétrage et la visualisation des projections climatiques historiques et prospectives en mode monde réel (Braudel) :
1. **Bloc Historique (-3000 à 2026)** : Présente les forçages calibrés (Optima Romain et Médiéval, P.A.G., événements volcaniques 536/Samalas/Tambora).
2. **Bloc Prospectif (2026 à 2100)** :
   - Mode Médian : Slider continu entre $+1.0^\circ\text{C}$ et $+4.0^\circ\text{C}$ (défaut $+2.5^\circ\text{C}$).
   - Mode Variabilité Multi-Scénarios RCP (GIEC) : Boutons interactifs et sélectionnables pour chaque trajectoire (`RCP2.6`, `RCP4.5`, `RCP6.0`, `RCP8.5`) ou bascule vers l'ensemble probabiliste complet.
3. **Synchronisation Store & Timeline** : La sélection d'un scénario met à jour instantanément `climateSelectedRcp`, répercuté sur la courbe thermique, la piste climat de la timeline, le niveau marin et les calottes glaciaires de la carte.

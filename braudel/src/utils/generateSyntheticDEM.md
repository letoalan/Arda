# Documentation — Générateur DEM Fractal Complet (`generateSyntheticDEM.ts`)

## Rôle
Génère le modèle numérique d'élévation (DEM) complet simulant la topographie naturelle d'un monde imaginaire avec le même réalisme hypsométrique que les tuiles terrestres de Braudel.

## Niveaux Hypsométriques & Synthèse Fractale (FBM)
1. **Bathymétrie & Fonds Marins** :
   - Pente douce du plateau continental le long des côtes, puis tombant vers les abysses océaniques (`-80m` à `-4000m`).
2. **Plaines & Bassins Côtiers** :
   - Transition côtière douce (`15m` à `300m`).
3. **Collines, Plateaux & Ondulations Mésoscopiques** :
   - Bruit fractal multi-octaves (4 octaves Simplex) générant les vallées, collines ondulées et plateaux intérieurs (`300m` à `800m`).
4. **Chaînes de Montagnes & Massifs Dessinés** :
   - Profil gaussien doux sur les crêtes dessinées avec modulation rocheuse (`1500m` à `3500m`).
5. **Pics & Sommets** :
   - Élévations coniques accentuées (`> 3000m`).

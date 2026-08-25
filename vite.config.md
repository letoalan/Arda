# Documentation — `vite.config.ts`

## Rôle
Configuration du bundler de développement et de build Vite pour le projet Braudel / Arda.

## Configuration GitHub Pages & Fichiers Statiques
- **`base`** : Défini dynamiquement via `process.env.BASE_URL` avec valeur par défaut `'/Arda/'` pour assurer la compatibilité avec le sous-chemin de déploiement GitHub Pages.
- **`publicDir`** : Configuré sur `'public'`. Tous les fonds cartographiques GeoJSON sont situés dans `public/data/` et sont automatiquement recopiés vers `dist/data/` lors du build statique.
- **Plugin `serve-data-dir`** : Middleware optionnel pour la rétrocompatibilité locale (`dev` / `preview`) servant les fichiers JSON depuis `public/data/` sous la route `/data`.

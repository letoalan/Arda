# Module `carto-logger.ts`

Ce module fournit un système de logs de diagnostic unifié et horodaté pour l'ensemble du moteur cartographique d'Arda (gestion des tuiles vectorielles, insertion et débrayage des graticules, maillage de rhumb, écouteurs de styles MapLibre).

## Fonctions Exportées
- `logCarto(tag: string, ...details: unknown[])` : Émet un log informatif préfixé par `[Carto Layers] [ISO_TIMESTAMP] [TAG]`.
- `logCartoWarn(tag: string, ...details: unknown[])` : Émet un avertissement horodaté.
- `logCartoError(tag: string, ...details: unknown[])` : Émet une erreur horodatée avec trace d'exécution.

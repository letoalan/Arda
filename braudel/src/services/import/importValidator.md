# Documentation — Validateur d'Import JSON (importValidator.ts)

## Rôle et Responsabilités
importValidator.ts valide la structure des fichiers JSON importés dans Arda/Braudel.

- **Vérification de schéma** : Utilise databaseSchema.safeParse avec remontée précise des erreurs de validation Zod.
- **Support des exports complets** : Accepte les fichiers d'export canoniques, les structures avec multi-polygones et les identifiants libres issus des catalogues historiques.

## Fil d'Ariane
[services/](../../services.md) -> [import/](./import.md) -> **importValidator.md**

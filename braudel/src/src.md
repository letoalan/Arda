# Dossier Source `src/`

## Rôle du Secteur
Le dossier `src/` contient l'ensemble du code source applicatif du projet Braudel / Tolkien. Le code est rigoureusement modularisé avec une contrainte de taille inférieure à 200 lignes par fichier.

## Emplacement
`src/`

## Structure du Secteur

| Sous-dossier | Rôle Résumé | Doc |
|---|---|---|
| **`app/`** | Vues, panneaux React et état global Zustand | [app.md](./app/app.md) |
| **`services/`** | Services techniques (cartographie, persistance, import, IA) | [services.md](./services/services.md) |
| **`core/`** | Schémas Zod, types de données, algorithmes | [core.md](./core/core.md) |
| **`acquisition/`** | Traitement d'image, dessin à main levée | [acquisition.md](./acquisition/acquisition.md) |
| **`utils/`** | Utilitaires transverses (DEM, géométrie, couleurs) | [utils.md](./utils/utils.md) |

## Fil d'Ariane
[Projet Braudel (Racine)](../README.md) -> [ARCHITECTURE.md](../docs/ARCHITECTURE.md) -> **src/**

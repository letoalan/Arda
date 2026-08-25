# Secteur `src/services/` (Services Techniques)

## Rôle du Secteur
Le secteur `services/` rassemble les modules techniques réutilisables et découplés de l'interface utilisateur.

## Sous-secteurs

| Sous-secteur | Rôle Résumé | Doc |
|---|---|---|
| **`cartography/`** | Service MapLibre, gestion des styles et du rendu GeoJSON | [cartography.md](./cartography/cartography.md) |
| **`persistence/`** | Couche d'accès aux données IndexedDB | [persistence.md](./persistence/persistence.md) |
| **`import/`** | Parsers, indexeur de candidats et normalisation GeoJSON | [import.md](./import/import.md) |
| **`ia/`** | Connecteurs et adaptateurs IA (Ollama & Mock) | [ia.md](./ia/ia.md) |
| **`vision/`** | Traitement d'image et pipeline vision LM Studio | [vision.md](./vision/vision.md) |
| **`export/`** | Modules d'exportation HTML, ZIP, Storyboard | [export.md](./export/export.md) |

## Fil d'Ariane
[src/](../src.md) -> **services/** -> [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

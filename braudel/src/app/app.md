# Secteur `src/app/` (Application & UI)

## Rôle du Secteur
Le secteur `app/` contient la couche de présentation React et la logique d'état applicatif Zustand.

## Structure du Secteur

| Sous-dossier / Fichier | Rôle | Doc |
|---|---|---|
| **`state/`** | Store central Zustand et Slices découplés | [state.md](./state/state.md) |
| **`views/`** | Vues UI principales et panneaux de contrôle | [views.md](./views/views.md) |
| **`components/`** | Composants UI atomiques et modales | [components.md](./components/components.md) |
| **`App.tsx`** | Composant racine d'assemblage et de routage des vues | [App.md](./App.md) |

## Fil d'Ariane
[src/](../src.md) -> **app/** -> [Architecture Global](../../docs/ARCHITECTURE.md)

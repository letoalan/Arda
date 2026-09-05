# Secteur `src/app/views/` (Vues UI & Panneaux)

## Rôle du Secteur
Le secteur `app/views/` regroupe l'ensemble des écrans principaux, panneaux latéraux et vues interactives de l'application.

## Fichiers Principaux du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`MapView.tsx`** | Conteneur principal de la carte MapLibre avec filtres | [MapView.md](./MapView.md) |
| **`TextureFilters.tsx`** | Injection des filtres SVG pour les textures de carte | [TextureFilters.md](./TextureFilters.md) |
| **`GeopoliticaPanel.tsx`** | Catalogue et panneau d'import des fonds GeoJSON | [GeopoliticaPanel.md](./GeopoliticaPanel.md) |
| **`EntityPanel.tsx`** | Gestion et filtrage temporel de la liste d'entités | [EntityPanel.md](./EntityPanel.md) |
| **`ContinentBuilderView.tsx`** | Studio de dessin et génération de continents (mode Tolkien) | [ContinentBuilderView.md](./ContinentBuilderView.md) |
| **`IAPanel.tsx`** | Panneau d'assistance IA et requêtes Ollama | [IAPanel.md](./IAPanel.md) |
| **`NetworkGraphView.tsx`** | Graphe interactif de réseau d'entités et d'égos | [NetworkGraphView.md](./NetworkGraphView.md) |
| **`TimelineView.tsx`** | Frise chronologique et contrôle du playback temporel | [TimelineView.md](./TimelineView.md) |
| **`StoryEditorPanel.tsx`** | Scénarisation Bento, ordonnancement des scènes et diapositives d'appui 16:9 | [StoryEditorPanel.md](./StoryEditorPanel.md) |
| **`DataPanel.tsx`** | Panneau d'import/export JSON, PDF haute fidélité et multimédia | [DataPanel.md](./DataPanel.md) |
| **`WelcomeScreen.tsx`** | Écran d'accueil et sélection du type de monde | [WelcomeScreen.md](./WelcomeScreen.md) |

## Fil d'Ariane
[app/](../app.md) -> **views/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

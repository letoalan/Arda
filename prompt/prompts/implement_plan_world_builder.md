Lot 0 – Cadrage et squelette
Objectif : comprendre l’existant et préparer le terrain.

Lire :

braudel.md (architecture globale, schémas de données, flux).
Memory
+1

App.tsx et ContinentBuilderView.tsx actuels.

Identifier :

Comment est représenté un “monde” (type World, champ worldType, entités, etc.).

Où est stocké l’état du monde (state React, store, IndexedDB, etc.).

Produire :

Un fichier docs/continent_builder_spec.md résumant :

le flux : “nouveau monde fictif → ContinentBuilderView → dessin → GeoJSON → tuiles → MapLibre”,

les types TypeScript nécessaires (World, Continent, ContinentDraft, etc.),

les interfaces de fonctions clés (ex. draftToGeoJSON, generateTilesFromGeoJSON).

Lot 1 – Dessin libre dans ContinentBuilderView
Objectif : permettre à l’utilisateur de dessiner des continents sur une carte monde plate.

Interface de base
Dans ContinentBuilderView.tsx :

Afficher un <canvas> plein écran ou dans une zone dédiée, représentant le monde entier (projection équirectangulaire).

Ajouter des contrôles simples :

bouton “Nouveau continent”,

bouton “Valider les continents”,

bouton “Annuler / Recommencer”.

Mode de dessin
Implémenter un mode “polygone libre” :

Clic = ajouter un point.

Double-clic = fermer le polygone en cours et l’ajouter à la liste des continents dessinés.

Afficher en temps réel le polygone en cours (ligne + points).

Permettre de dessiner plusieurs continents (plusieurs polygones).

Représentation interne

Créer un type ContinentDraft :


ts
type ContinentDraft = {
id: string;
points: { x: number; y: number }[]; // en pixels du canvas
name?: string;
};
Stocker l’état dans le composant :


ts
const [drafts, setDrafts] = useState<ContinentDraft[]>([]);
const [currentDraft, setCurrentDraft] = useState<ContinentDraft | null>(null);
Visualisation

À chaque mise à jour, redessiner :

tous les polygones validés (couleur de remplissage + contour),

le polygone en cours (contour + points).

Tests manuels

Vérifier que l’on peut :

créer plusieurs continents,

les voir s’afficher correctement,

les valider via le bouton.

Lot 2 – Conversion dessin → GeoJSON
Objectif : transformer les polygones pixels en GeoJSON (lon/lat).

Fonction de conversion
Créer un module src/utils/draftToGeoJSON.ts :

Fonction principale :


ts
export function draftsToGeoJSON(
drafts: ContinentDraft[],
canvasWidth: number,
canvasHeight: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon>;
Logique de projection (équirectangulaire → lon/lat) :

lon = (x / canvasWidth) * 360 - 180

lat = 90 - (y / canvasHeight) * 180

Pour chaque ContinentDraft :

Convertir chaque point (x, y) en [lon, lat].

Fermer le polygone (premier point = dernier point).

Créer un Feature<Polygon> avec :

properties: { type: "continent", name: draft.name ?? "" }

geometry: { type: "Polygon", coordinates: [ring] }.

Intégration dans ContinentBuilderView

Lors du clic sur “Valider les continents” :

Appeler draftsToGeoJSON.

Obtenir un FeatureCollection.

Stocker ce GeoJSON dans l’état du monde (cohérent avec braudel.md).
Memory
+1

Premier affichage dans MapLibre

Ajouter un mode “debug” :

Au lieu de retourner à la carte normale, afficher un composant DebugMapView qui :

initialise MapLibre,

ajoute une source geojson avec le GeoJSON généré,

affiche un layer fill + line simple (couleur unie).

Vérifier que les continents s’affichent correctement sur le globe.

Lot 3 – Génération de tuiles vectorielles (MVT)
Objectif : passer du GeoJSON à des tuiles vectorielles compatibles MapLibre.

Choix d’approche
Pour un MVP local-first, privilégier :

Option A (recommandée) : génération à la volée côté client avec une librairie JS.

Ex. geojson-vt + @mapbox/vector-tile ou équivalent.

Option B : génération au “build / export” via un script Node (ex. tippecanoe ou geojson2mvt), puis chargement des tuiles par MapLibre.

Pour commencer, implémenter Option A en prototype.

Module de tiling
Créer src/utils/generateMVT.ts :

Fonction :


ts
export function generateMVTFromGeoJSON(
geojson: GeoJSON.FeatureCollection,
maxZoom: number
): Map<number, Map<string, ArrayBuffer>>;
// zoom -> tileKey (x_y) -> buffer MVT
Utiliser geojson-vt pour découper le GeoJSON en tuiles par zoom.

Encoder chaque tuile en MVT (PBF) avec @mapbox/vector-tile ou équivalent.

Stockage local des tuiles

Pour le prototype, tu peux :

Garder les tuiles en mémoire (Map),

Ou les stocker dans IndexedDB (clé : tiles/{zoom}/{x}/{y}).

Source vectorielle MapLibre

Créer un custom source MapLibre ou utiliser un plugin qui permet de charger des tuiles MVT depuis un objet en mémoire / IndexedDB.

Si trop complexe pour le MVP :

Utiliser directement le GeoJSON dans MapLibre (Lot 2) et reporter le vrai MVT à une itération suivante, mais en ayant déjà le code de génération prêt.

Lot 4 – Intégration complète & relief (optionnel)
Objectif : afficher le monde fictif avec un rendu proche du style Braudel (contours + relief).

Style MapLibre

Créer un style fictional-world-style.json avec :

source vectorielle continents (MVT ou GeoJSON),

layer continents-fill,

layer continents-line (contours),

optionnellement :

source raster-dem (si tu génères un DEM),

layers hillshade et color-relief.
Memory
+1

Génération de DEM (optionnel mais cohérent)

À partir des polygones continents :

Créer une grille raster (ex. 1024×512) avec une altitude par pixel :

0 en mer,

valeur > 0 sur les continents (ex. fonction de distance à la côte + bruit).

Exporter en GeoTIFF ou format compatible raster-dem MapLibre.

Rendu final

Dans App.tsx, après validation des continents :

Générer GeoJSON + tuiles (+ DEM si activé).

Basculer sur la vue carte principale avec le style fictional-world-style.

Vérifier que l’on peut naviguer, zoomer, et que le relief/contours s’affichent correctement.

Livrables attendus de Gemini 3.5 Low
À l’issue de ce travail, tu dois avoir produit :

ContinentBuilderView.tsx :

outil de dessin de polygones libres,

boutons “Nouveau continent”, “Valider”, “Annuler”,

état interne ContinentDraft[].

src/utils/draftToGeoJSON.ts :

conversion pixels → lon/lat,

production d’un FeatureCollection de continents.

(Option A MVP) src/utils/generateMVT.ts :

génération de tuiles MVT à partir de GeoJSON.

Composant(s) MapLibre :

DebugMapView.tsx (GeoJSON direct),

ou intégration directe dans la carte principale avec source vectorielle.

Style MapLibre :

styles/fictional-world-style.json (continents + contours, optionnellement hillshade/color-relief).
Memory

Documentation minimale :

docs/continent_builder_spec.md (flux, types, fonctions clés).

Mode de travail recommandé
Travailler lot par lot, en validant chaque lot par des tests manuels (création de monde fictif, dessin, génération, affichage).

Pour chaque lot :

écrire le code,

tester dans l’application,

ajuster les types et l’interface si nécessaire.

Ne pas chercher à faire tout parfait du premier coup : viser un MVP fonctionnel (dessin → GeoJSON → affichage MapLibre), puis itérer pour le tiling MVT et le relief.
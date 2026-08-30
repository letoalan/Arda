# Documentation — Rendu Page PDF Cartographique (`pdf-page-renderer.ts`)

## Rôle et Responsabilités
`pdf-page-renderer.ts` implémente le moteur de composition d'une planche cartographique unitaire au format A4 Paysage (297 × 210 mm) :
- **Cartouche supérieur** : Titre personnalisé, datation historique ($T$), style graphique, date/heure de génération et pagination.
- **Zone cartographique** : Rendu de l'image de la carte compressée en JPEG 90% avec cadrage anti-déformation (*Smart Aspect Ratio*), bordure technique (*Neatline*), flèche du Nord et échelle métrique.
- **Légende structurée & Déduplication** : Panneau latéral avec badge de contexte historique, déduplication stricte des entités polygonales morcelées, catégorisation géométrique précise (Territoires / Surfaces, Itinéraires / Lignes, Lieux / Villes, Relations / Flux) et encadré de synthèse statistique géo-historique évitant les espaces vides.
- **Pied de page** : Mentions légales et format normalisé.

## Dépendances
- `jspdf`
- `pdf-types.ts`
- `pdf-map-capture.ts`
- `pdf-carto-elements.ts`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-page-renderer.md**

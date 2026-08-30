# Documentation — Typage et Prédicats Temporels PDF (`pdf-types.ts`)

## Rôle et Responsabilités
`pdf-types.ts` définit les interfaces, classes d'erreur et fonctions de filtrage spatio-temporel utilisées par l'ensemble du sous-système d'export PDF :
- **`PDFExportOptions`** : Options de configuration des pages et livrets cartographiques (titres, métadonnées, notes, mode multi-pages).
- **`EpochExportTarget`** : Cible temporelle d'export ($T_{\text{snapshot}}$, libellé, année de référence catalogue, bornes).
- **`PdfExportError`** : Classe d'erreur spécifique levée lors des dépassements de délais ou échecs de rendu.
- **`isEntityVisibleAt` & `isRelationVisibleAt`** : Évaluation polymorphe de visibilité à une date $T$ ou sur une intersection d'époque `epochRange`.

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-types.md**

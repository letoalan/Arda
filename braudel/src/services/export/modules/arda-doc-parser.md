# arda-doc-parser.ts — Parseur, Validateur et Migrations ArdaDoc

Ce module fournit les outils nécessaires pour importer, valider et faire évoluer les documents `ArdaDoc` intégrés au sein des fichiers `.html` exportés (servant de format de sauvegarde canonique).

## Fonctions exportées

- `parseArdaDocFromHtml(htmlContent: string): ArdaDoc` : Récupère la balise `<script type="application/arda+json" id="arda-doc">` et parse l'objet JSON.
- `validateArdaDocSchema(doc: any): ArdaValidationResult` : Vérifie la présence des champs obligatoires (`format`, `map`, `waypoints`).
- `migrateArdaDoc(rawDoc: any): ArdaDoc` : Applique les valeurs par défaut et migrations ascendantes (ex. injection de `schemaVersion`, structure `terrain`, normalisation `elements[]`).

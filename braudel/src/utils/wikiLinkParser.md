# Documentation — Parseur de Liens Wiki (`wikiLinkParser.ts`)

## Rôle & Responsabilité
`wikiLinkParser.ts` est responsable de l'extraction, de la validation et de la tokenisation des liens internes au format `[[Nom]]` ou `[[Nom Cible|Libellé]]` au sein du contenu Markdown des entités.

## Fonctions Exportées
- `parseWikiLinks(markdown, entities)` : Extrait la liste des `WikiLink` avec résolution vers l'`entityId` et détection des liens brisés (`isBroken: true`).
- `tokenizeWikiText(markdown, entities)` : Découpe une chaîne en segments de texte brut et en jetons de liens cliquables pour l'affichage interactif React.

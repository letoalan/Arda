# Documentation — Schéma Wiki (`wiki.ts`)

## Rôle & Responsabilité
Le fichier `wiki.ts` définit les schémas Zod et les types TypeScript pour l'extension Wiki de la Version 1.1 :
- `wikiLinkSchema` : Modélisation des liens hypertextes internes (`[[Nom Entité]]`), résolus vers un `targetEntityId` ou marqués comme brisés (`isBroken`).
- `wikiPageSchema` : Modélisation d'une pseudopage wiki liée à une entité (`entityId`, `title`, `content` en Markdown, `tags`, `outgoingLinks`).

## Types Principaux
- `WikiLink` : Représente un lien sortant extrait d'un contenu Markdown.
- `WikiPage` : Structure complète de documentation textuelle pour un acteur ou un actant.

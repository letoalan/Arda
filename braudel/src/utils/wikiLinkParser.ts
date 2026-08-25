import { WikiLink } from '../core/schema/wiki';

export interface EntityLookup {
  id: string;
  name: string;
}

export interface ParsedWikiToken {
  type: 'text' | 'link';
  content: string;
  targetName?: string;
  targetEntityId?: string;
  isBroken?: boolean;
}

/**
 * Extrait tous les liens wikilinks format [[Nom]] ou [[Nom|Alias]] d'un texte markdown.
 */
export function parseWikiLinks(markdown: string, entities: EntityLookup[] = []): WikiLink[] {
  if (!markdown) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    const rawInner = match[1].trim();
    const parts = rawInner.split('|');
    const targetName = parts[0].trim();

    const matchedEntity = entities.find(
      (e) => e.name.toLowerCase() === targetName.toLowerCase()
    );

    links.push({
      rawText: match[0],
      targetName,
      targetEntityId: matchedEntity ? matchedEntity.id : undefined,
      isBroken: !matchedEntity
    });
  }

  return links;
}

/**
 * Tokenise un texte markdown contenant des wikilinks pour faciliter le rendu React interactif.
 */
export function tokenizeWikiText(markdown: string, entities: EntityLookup[] = []): ParsedWikiToken[] {
  if (!markdown) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const tokens: ParsedWikiToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: markdown.substring(lastIndex, match.index)
      });
    }

    const rawInner = match[1].trim();
    const parts = rawInner.split('|');
    const targetName = parts[0].trim();
    const displayLabel = parts.length > 1 ? parts[1].trim() : targetName;

    const matchedEntity = entities.find(
      (e) => e.name.toLowerCase() === targetName.toLowerCase()
    );

    tokens.push({
      type: 'link',
      content: displayLabel,
      targetName,
      targetEntityId: matchedEntity ? matchedEntity.id : undefined,
      isBroken: !matchedEntity
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < markdown.length) {
    tokens.push({
      type: 'text',
      content: markdown.substring(lastIndex)
    });
  }

  return tokens;
}

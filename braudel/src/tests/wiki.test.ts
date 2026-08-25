import { describe, it, expect } from 'vitest';
import { parseWikiLinks, tokenizeWikiText } from '../utils/wikiLinkParser';
import { wikiPageSchema, wikiLinkSchema } from '../core/schema/wiki';
import { entitySchema } from '../core/schema/entities';

describe('Épopée A — Extension Wiki', () => {
  const mockEntities = [
    { id: 'entity-1', name: 'Athènes' },
    { id: 'entity-2', name: 'Sparte' },
    { id: 'entity-3', name: 'Ligue de Délos' }
  ];

  describe('A1. Modèle de données & Schémas Zod', () => {
    it('doit valider une structure wikiLinkSchema', () => {
      const link = {
        rawText: '[[Athènes]]',
        targetName: 'Athènes',
        targetEntityId: 'entity-1',
        isBroken: false
      };
      const parsed = wikiLinkSchema.parse(link);
      expect(parsed.targetName).toBe('Athènes');
      expect(parsed.isBroken).toBe(false);
    });

    it('doit valider une structure wikiPageSchema', () => {
      const page = {
        entityId: 'entity-1',
        title: 'Athènes',
        content: 'Cité grecque majeure liée à [[Sparte]].',
        tags: ['antiquité', 'cité-état'],
        outgoingLinks: [
          { rawText: '[[Sparte]]', targetName: 'Sparte', targetEntityId: 'entity-2', isBroken: false }
        ]
      };
      const parsed = wikiPageSchema.parse(page);
      expect(parsed.tags).toHaveLength(2);
      expect(parsed.outgoingLinks).toHaveLength(1);
    });

    it('doit valider le champ optionnel wikiContent sur entitySchema (rétrocompatibilité v1.0)', () => {
      const entityWithoutWiki = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        worldId: '123e4567-e89b-12d3-a456-426614174001',
        layerId: '123e4567-e89b-12d3-a456-426614174002',
        type: 'place',
        name: 'Rome',
        meta: {}
      };
      expect(() => entitySchema.parse(entityWithoutWiki)).not.toThrow();

      const entityWithWiki = {
        ...entityWithoutWiki,
        wikiContent: 'Capitale impériale.'
      };
      const parsed = entitySchema.parse(entityWithWiki);
      expect(parsed.wikiContent).toBe('Capitale impériale.');
    });
  });

  describe('A2. Parseur de liens internes (wikiLinkParser)', () => {
    it('doit extraire les wikilinks simples et les lier aux entités', () => {
      const markdown = 'La guerre oppose [[Athènes]] à [[Sparte]].';
      const links = parseWikiLinks(markdown, mockEntities);

      expect(links).toHaveLength(2);
      expect(links[0].targetName).toBe('Athènes');
      expect(links[0].targetEntityId).toBe('entity-1');
      expect(links[0].isBroken).toBe(false);

      expect(links[1].targetName).toBe('Sparte');
      expect(links[1].targetEntityId).toBe('entity-2');
      expect(links[1].isBroken).toBe(false);
    });

    it('doit détecter les liens brisés lorsque l’entité n’existe pas', () => {
      const markdown = 'Visite de [[Corinthe]] et [[Athènes]].';
      const links = parseWikiLinks(markdown, mockEntities);

      expect(links).toHaveLength(2);
      expect(links[0].targetName).toBe('Corinthe');
      expect(links[0].isBroken).toBe(true);
      expect(links[0].targetEntityId).toBeUndefined();

      expect(links[1].targetName).toBe('Athènes');
      expect(links[1].isBroken).toBe(false);
    });

    it('doit supporter la syntaxe avec alias [[Nom|Libellé]]', () => {
      const markdown = 'Allégeance à [[Ligue de Délos|l’alliance maritime]].';
      const tokens = tokenizeWikiText(markdown, mockEntities);

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].content).toBe('Allégeance à ');
      expect(tokens[1].type).toBe('link');
      expect(tokens[1].content).toBe('l’alliance maritime');
      expect(tokens[1].targetName).toBe('Ligue de Délos');
      expect(tokens[1].targetEntityId).toBe('entity-3');
      expect(tokens[2].type).toBe('text');
      expect(tokens[2].content).toBe('.');
    });

    it('doit gérer les textes sans liens ou vides', () => {
      expect(parseWikiLinks('')).toEqual([]);
      expect(tokenizeWikiText('')).toEqual([]);
      const textOnly = tokenizeWikiText('Texte simple sans aucun lien.');
      expect(textOnly).toHaveLength(1);
      expect(textOnly[0].type).toBe('text');
    });
  });
});

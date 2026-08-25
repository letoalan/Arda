import { describe, it, expect } from 'vitest';
import {
  isVisibleAt,
  filterByTime,
  isValidTemporalRange,
  unionTemporalRange,
  overlapsTemporalRange,
} from '../core/temporal/index';

describe('core/temporal — filtrage temporel', () => {
  describe('isVisibleAt', () => {
    it('retourne true si pas de temporalRange (existence permanente)', () => {
      expect(isVisibleAt({}, 1500)).toBe(true);
    });

    it('retourne true si l\'année est dans la plage', () => {
      expect(isVisibleAt({ temporalRange: { validFrom: 1000, validTo: 2000 } }, 1500)).toBe(true);
    });

    it('retourne true aux bornes exactes', () => {
      expect(isVisibleAt({ temporalRange: { validFrom: 1000, validTo: 2000 } }, 1000)).toBe(true);
      expect(isVisibleAt({ temporalRange: { validFrom: 1000, validTo: 2000 } }, 2000)).toBe(true);
    });

    it('retourne false si l\'année est avant validFrom', () => {
      expect(isVisibleAt({ temporalRange: { validFrom: 1500, validTo: 2000 } }, 1000)).toBe(false);
    });

    it('retourne false si l\'année est après validTo', () => {
      expect(isVisibleAt({ temporalRange: { validFrom: 1000, validTo: 1500 } }, 2000)).toBe(false);
    });
  });

  describe('filterByTime', () => {
    const items = [
      { id: '1', temporalRange: { validFrom: -500, validTo: 500 } },
      { id: '2', temporalRange: { validFrom: 1000, validTo: 1500 } },
      { id: '3' }, // permanent
      { id: '4', temporalRange: { validFrom: 1800, validTo: 2100 } },
    ];

    it('filtre correctement pour une année donnée', () => {
      const result = filterByTime(items, 1200);
      const ids = result.map(i => i.id);
      expect(ids).toContain('2'); // dans la plage
      expect(ids).toContain('3'); // permanent
      expect(ids).not.toContain('1'); // avant
      expect(ids).not.toContain('4'); // après
    });

    it('inclut tous les permanents quelle que soit l\'année', () => {
      expect(filterByTime(items, -9999).map(i => i.id)).toContain('3');
      expect(filterByTime(items, 9999).map(i => i.id)).toContain('3');
    });

    it('retourne liste vide si aucun visible', () => {
      const strictItems = [
        { id: 'a', temporalRange: { validFrom: 2000, validTo: 2100 } },
      ];
      expect(filterByTime(strictItems, 1000)).toHaveLength(0);
    });
  });

  describe('isValidTemporalRange', () => {
    it('valide un range cohérent', () => {
      expect(isValidTemporalRange({ validFrom: 100, validTo: 200 })).toBe(true);
    });

    it('valide un range ponctuel (validFrom === validTo)', () => {
      expect(isValidTemporalRange({ validFrom: 500, validTo: 500 })).toBe(true);
    });

    it('invalide un range inversé', () => {
      expect(isValidTemporalRange({ validFrom: 500, validTo: 100 })).toBe(false);
    });
  });

  describe('unionTemporalRange', () => {
    it('retourne undefined pour une liste vide', () => {
      expect(unionTemporalRange([])).toBeUndefined();
    });

    it('calcule l\'union de plusieurs ranges', () => {
      const result = unionTemporalRange([
        { validFrom: 100, validTo: 500 },
        { validFrom: 300, validTo: 800 },
        { validFrom: -50, validTo: 200 },
      ]);
      expect(result).toEqual({ validFrom: -50, validTo: 800 });
    });
  });

  describe('overlapsTemporalRange', () => {
    it('détecte le chevauchement', () => {
      expect(overlapsTemporalRange(
        { validFrom: 100, validTo: 500 },
        { validFrom: 400, validTo: 700 }
      )).toBe(true);
    });

    it('détecte la non-intersection', () => {
      expect(overlapsTemporalRange(
        { validFrom: 100, validTo: 400 },
        { validFrom: 500, validTo: 700 }
      )).toBe(false);
    });

    it('détecte la contiguïté exacte comme non-intersection', () => {
      // [100,400] et [400,700] — partagent le point 400
      expect(overlapsTemporalRange(
        { validFrom: 100, validTo: 400 },
        { validFrom: 400, validTo: 700 }
      )).toBe(true);
    });
  });
});

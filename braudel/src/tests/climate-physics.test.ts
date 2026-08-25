import { describe, it, expect } from 'vitest';
import {
  tempToSeaLevel,
  tempToIceCapLatitude,
  interpolateClimateAtYear,
  climateToSeaLevel,
  climateToIceCap,
  filterOceanConnectivity
} from '../core/climate/climatePhysics';

describe('Épopée B — Module Climatique (Physique)', () => {
  describe('B1. Fonctions de conversion physique', () => {
    it('doit calculer le niveau marin pour 0°C, +1°C, +4°C et -4°C', () => {
      expect(tempToSeaLevel(0)).toBe(0);
      expect(tempToSeaLevel(1)).toBe(2.3);
      expect(tempToSeaLevel(4)).toBe(9.2);
      expect(tempToSeaLevel(-4)).toBe(-120);
    });

    it('doit calculer la latitude des calottes pour 0°C, +4°C et -4°C', () => {
      expect(tempToIceCapLatitude(0)).toBe(66.5);
      expect(tempToIceCapLatitude(4)).toBe(86.5);
      expect(tempToIceCapLatitude(-4)).toBe(46.5);
    });

    it('doit borner la latitude des calottes entre 30° et 90°', () => {
      expect(tempToIceCapLatitude(10)).toBe(90);
      expect(tempToIceCapLatitude(-15)).toBe(30);
    });

    it('doit interpoler fidèlement la température entre deux points', () => {
      const points = [
        { year: 1850, deltaTemp: 0 },
        { year: 2050, deltaTemp: 2.0 }
      ];

      expect(interpolateClimateAtYear(points, 1800)).toBe(0);
      expect(interpolateClimateAtYear(points, 1850)).toBe(0);
      expect(interpolateClimateAtYear(points, 1950)).toBe(1.0);
      expect(interpolateClimateAtYear(points, 2050)).toBe(2.0);
      expect(interpolateClimateAtYear(points, 2100)).toBe(2.0);
    });

    it('doit transformer une série complète en courbes de niveau marin et de calottes', () => {
      const points = [
        { year: 2000, deltaTemp: 0.5 },
        { year: 2100, deltaTemp: 2.0 }
      ];

      const seaLevels = climateToSeaLevel(points);
      expect(seaLevels[0].seaLevel).toBe(1.2);
      expect(seaLevels[1].seaLevel).toBe(4.6);

      const iceCaps = climateToIceCap(points);
      expect(iceCaps[0].iceCapLatitude).toBe(69.0);
      expect(iceCaps[1].iceCapLatitude).toBe(76.5);
    });
  });

  describe('B2. Filtrage de connectivité océanique et génération de couches', () => {
    it('doit inonder les côtes connectées et préserver les cuvettes isolées', () => {
      // Grille 5x5 d'altitudes
      // Bordure basse (0m), centre haut (10m), cuvette isolée au centre (0m entourée de 10m)
      const grid = [
        [0, 0, 0, 0, 0],
        [0, 10, 10, 10, 0],
        [0, 10, -5, 10, 0], // cuvette isolée à (2,2) avec altitude -5m
        [0, 10, 10, 10, 0],
        [0, 0, 0, 0, 0]
      ];

      const oceanMask = filterOceanConnectivity(grid, 0, 5, 5);

      // Les bords sont inondés (océan)
      expect(oceanMask[0][0]).toBe(true);
      expect(oceanMask[0][2]).toBe(true);
      expect(oceanMask[4][4]).toBe(true);

      // Le rempart de montagnes reste sec
      expect(oceanMask[1][1]).toBe(false);

      // La cuvette isolée au centre, bien qu'ayant une altitude négative (-5m), n'est PAS connectée à l'océan !
      expect(oceanMask[2][2]).toBe(false);
    });

    it('doit générer les polygones d’inondation du niveau marin pour +7.7m', async () => {
      const { generateSeaLevelGeoJSON, generateIceCapsGeoJSON } = await import('../services/cartography/modules/climate-layers');
      
      const seaLevelGeo = generateSeaLevelGeoJSON(7.7);
      expect(seaLevelGeo.type).toBe('FeatureCollection');
      expect(seaLevelGeo.features.length).toBeGreaterThan(0);
      expect(seaLevelGeo.features[0].properties.seaLevel).toBe(7.7);
      expect(seaLevelGeo.features.some(f => f.properties.name.includes('Pays-Bas'))).toBe(true);

      const iceCapGeo = generateIceCapsGeoJSON(75.0);
      expect(iceCapGeo.features).toHaveLength(2); // Pôle Nord et Pôle Sud
    });

    it('doit associer la couleur exacte de l’eau selon le style de tuile/carte', async () => {
      const { getWaterColorForBasemapStyle } = await import('../services/cartography/modules/climate-layers');
      
      expect(getWaterColorForBasemapStyle('antiquity')).toBe('#047857');
      expect(getWaterColorForBasemapStyle('contemporary_current')).toBe('#0284c7');
      expect(getWaterColorForBasemapStyle('military_staff_ww1_ww2')).toBe('#94a3b8');
      expect(getWaterColorForBasemapStyle('colonial')).toBe('#cbe2ee');
      expect(getWaterColorForBasemapStyle('contemporary_positron_lite')).toBe('#070f1e');
      expect(getWaterColorForBasemapStyle('tolkien_high_fantasy')).toBe('#123a5c');
    });

    it('doit générer un dégradé réaliste reflétant les petits âges glaciaires et réchauffements', async () => {
      const { tempToClimateColor, generateClimateGradient } = await import('../core/climate/climatePhysics');

      expect(tempToClimateColor(-3.5)).toBe('#1e3a8a'); // Grand hiver glaciaire
      expect(tempToClimateColor(-0.7)).toBe('#38bdf8'); // Petit Âge Glaciaire
      expect(tempToClimateColor(0.0)).toBe('#10b981');  // Pré-industriel
      expect(tempToClimateColor(0.6)).toBe('#fbbf24');  // Optimum Médiéval
      expect(tempToClimateColor(2.5)).toBe('#ef4444');  // Réchauffement marqué

      const points = [
        { year: 1000, deltaTemp: 0.6 },  // Optimum Médiéval
        { year: 1650, deltaTemp: -0.7 }, // Petit Âge Glaciaire
        { year: 2026, deltaTemp: 1.3 }   // Époque Contemporaine
      ];

      const gradient = generateClimateGradient(points, 1000, 2026, 10);
      expect(gradient).toContain('linear-gradient(90deg,');
      expect(gradient).toContain('#fbbf24'); // Présence du doré médiéval
      expect(gradient).toContain('#38bdf8'); // Présence du bleu glacial
      expect(gradient).toContain('#f97316'); // Présence de l'orange contemporain
    });
  });
});


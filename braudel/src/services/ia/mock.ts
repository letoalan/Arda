import { IAAdapter, IARequest, IAResponse, AiValidationResult } from '../../types/ia';

export interface MockConfig {
  name: string;
  delay?: number;
  errorRate?: number;
}

export class MockIAAdapter implements IAAdapter<MockConfig> {
  public config: MockConfig;

  constructor(config: Partial<MockConfig> = {}) {
    this.config = {
      name: 'mock',
      delay: config.delay ?? 500,
      errorRate: config.errorRate ?? 0.1,
      ...config,
    };
  }

  async generate(request: IARequest): Promise<IAResponse> {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, this.config.delay));

    if (Math.random() < (this.config.errorRate || 0)) {
      throw new Error(`Simulated error for task: ${request.task}`);
    }

    let output: Record<string, unknown> = {};

    switch (request.task) {
      case 'generateEntity':
        output = this.generateMockEntity(request.instruction, request.context as any);
        break;
      case 'generateRelation':
        output = this.generateMockRelation(request.context as any);
        break;
      case 'suggestName':
        output = { name: `Suggested_${request.instruction}` };
        break;
      case 'import_interpretation':
        output = this.generateMockImportInterpretation(request.context as any);
        break;
      default:
        output = { result: `Mock response for ${request.task}`, instruction: request.instruction };
    }

    return {
      id: crypto.randomUUID(),
      output,
      confidence: 0.85 + Math.random() * 0.15,
      metadata: {
        model: this.config.name,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  validate(response: IAResponse): AiValidationResult {
    if (!response.output || !response.metadata) {
      return {
        isValid: false,
        errors: ['Response missing required fields'],
      };
    }
    if (response.confidence < 0.3) {
      return {
        isValid: true,
        warnings: ['Low confidence score'],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  }

  private generateMockEntity(instruction: string, context?: any): Record<string, unknown> {
    const isTolkienFeature = context?.isTolkien || 
                            instruction.toLowerCase().includes('tolkien') || 
                            instruction.toLowerCase().includes('dessine') || 
                            instruction.toLowerCase().includes('trace') || 
                            instruction.toLowerCase().includes('relief');
    if (isTolkienFeature) {
      let featureType = 'continent';
      if (instruction.toLowerCase().includes('montagne') || instruction.toLowerCase().includes('mountain')) {
        featureType = 'mountain';
      } else if (instruction.toLowerCase().includes('colline') || instruction.toLowerCase().includes('hill')) {
        featureType = 'hills';
      } else if (instruction.toLowerCase().includes('fosse') || instruction.toLowerCase().includes('trench')) {
        featureType = 'trench';
      }

      // Generate a series of coordinates for the mock drawing within [-20, 20]
      const coords: [number, number][] = [];
      const centerLon = Math.random() * 20 - 10;
      const centerLat = Math.random() * 20 - 10;
      const numPoints = featureType === 'continent' ? 6 : 4;
      const radius = 5 + Math.random() * 5;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        coords.push([
          centerLon + radius * Math.cos(angle) + (Math.random() * 2 - 1),
          centerLat + radius * Math.sin(angle) + (Math.random() * 2 - 1)
        ]);
      }
      
      let geometry: any;
      if (featureType === 'continent' || featureType === 'hills') {
        coords.push(coords[0]); // Close
        geometry = { type: 'Polygon', coordinates: [coords] };
      } else {
        geometry = { type: 'LineString', coordinates: coords };
      }

      return {
        name: `Relief IA ${instruction.substring(0, 15)}`,
        type: featureType,
        geometry
      };
    }

    const types = ['place', 'event', 'actor', 'concept'];
    return {
      name: `Generated_${instruction.replace(/\s+/g, '_')}`,
      type: types[Math.floor(Math.random() * types.length)],
      description: instruction,
      geometry: {
        type: 'Point',
        coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90],
      },
    };
  }

  private generateMockRelation(context: any): Record<string, unknown> {
    return {
      type: 'influence',
      sourceId: context?.sourceId || crypto.randomUUID(),
      targetId: context?.targetId || crypto.randomUUID(),
      direction: Math.random() > 0.5 ? 'directed' : 'undirected',
    };
  }

  private generateMockImportInterpretation(context?: any): Record<string, unknown> {
    const count = context?.shapes_count || 1;
    const suggestions = [];
    for (let i = 0; i < count; i++) {
      suggestions.push({
        name: `Région Tolkien Fantastique ${i + 1}`,
        type: i % 2 === 0 ? 'continent' : 'mountain',
        layer: i % 2 === 0 ? 'political' : 'physical',
        description: `Tracé fantastique interprété par le modèle mock.`
      });
    }
    return {
      suggestions
    };
  }
}

export const createMockIAAdapter = (config?: Partial<MockConfig>): IAAdapter<MockConfig> => {
  return new MockIAAdapter(config);
};

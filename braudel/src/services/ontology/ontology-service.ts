// Ontology Service - Loads and provides access to ontology JSON files from ia-braudel/ontology

export interface OntologyTypes {
  entityTypes: string[];
  relationTypes: string[];
  operationTypes: string[];
  styleTypes: string[];
  timelineTypes: string[];
}

export class OntologyService {
  private ontologyPath = '/ia-braudel/ontology';
  private cachedOntologies: Record<string, string[]> = {};
  private loaded = false;

  async loadAll(): Promise<OntologyTypes> {
    if (this.loaded) {
      return this.getLoadedOntologies();
    }

    try {
      const [entityTypes, relationTypes, operationTypes, styleTypes, timelineTypes] = await Promise.all([
        this.loadOntologyFile('entity_types.json'),
        this.loadOntologyFile('relation_types.json'),
        this.loadOntologyFile('operation_types.json'),
        this.loadOntologyFile('style_types.json'),
        this.loadOntologyFile('timeline_types.json'),
      ]);

      this.cachedOntologies = {
        entityTypes,
        relationTypes,
        operationTypes,
        styleTypes,
        timelineTypes,
      };

      this.loaded = true;

      return this.getLoadedOntologies();
    } catch (error) {
      console.error('Failed to load ontology files:', error);
      // Return empty arrays as fallback
      return {
        entityTypes: [],
        relationTypes: [],
        operationTypes: [],
        styleTypes: [],
        timelineTypes: [],
      };
    }
  }

  private async loadOntologyFile(filename: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.ontologyPath}/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`Could not load ontology file ${filename}:`, error);
      return [];
    }
  }

  private getLoadedOntologies(): OntologyTypes {
    return {
      entityTypes: this.cachedOntologies.entityTypes || [],
      relationTypes: this.cachedOntologies.relationTypes || [],
      operationTypes: this.cachedOntologies.operationTypes || [],
      styleTypes: this.cachedOntologies.styleTypes || [],
      timelineTypes: this.cachedOntologies.timelineTypes || [],
    };
  }

  getEntityTypes(): string[] {
    return this.cachedOntologies.entityTypes || [];
  }

  getRelationTypes(): string[] {
    return this.cachedOntologies.relationTypes || [];
  }

  getOperationTypes(): string[] {
    return this.cachedOntologies.operationTypes || [];
  }

  getStyleTypes(): string[] {
    return this.cachedOntologies.styleTypes || [];
  }

  getTimelineTypes(): string[] {
    return this.cachedOntologies.timelineTypes || [];
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const ontologyService = new OntologyService();

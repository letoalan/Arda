import { describe, it, expect, vi } from 'vitest';
import * as exportService from '../services/export/index';
import * as importService from '../services/import/index';

// Mock IndexedDB for testing
vi.mock('../services/persistence/indexeddb', () => ({
  openDB: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  put: vi.fn(),
  deleteRecord: vi.fn(),
  queryByWorldId: vi.fn(),
  getAll: vi.fn()
}));

describe('Export/Import JSON Canonique', () => {
  describe('Export functionality', () => {
    it('should export world data to canonical JSON format', () => {
      const now = new Date().toISOString();
      const testWorld = {
        meta: [{ id: 'meta' as const, schemaVersion: 1, createdAt: now, updatedAt: now }],
        world: [],
        layers: [],
        entities: [],
        relations: [],
        timelines: [],
        styles: [],
        imports: [],
        ai: [],
        views: [],
        history: []
      };

      const jsonExport = exportService.exportFromStore(testWorld);
      const parsedData = JSON.parse(jsonExport);

      expect(parsedData._meta).toBeDefined();
      expect(parsedData._meta.version).toBe('1.0.0');
      expect(parsedData._meta.timestamp).toBeDefined();
      expect(parsedData._meta.source).toBe('store');
      expect(parsedData.meta.length).toBe(1);
    });

    it('should format JSON with proper indentation', () => {
      const now = new Date().toISOString();
      const testWorld = {
        meta: [],
        world: [],
        layers: [{
          id: crypto.randomUUID(),
          worldId: crypto.randomUUID(),
          type: 'physical' as const,
          name: 'Test Layer',
          order: 0,
          visible: true,
          meta: {
            id: 'meta' as const,
            schemaVersion: 1,
            createdAt: now,
            updatedAt: now
          }
        }],
        entities: [],
        relations: [],
        timelines: [],
        styles: [],
        imports: [],
        ai: [],
        views: [],
        history: []
      };

      const jsonExport = exportService.exportFromStore(testWorld);
      
      // Check that JSON is properly formatted (has newlines and indentation)
      expect(jsonExport).toContain('\n');
    });
  });

  describe('Import functionality', () => {
    it('should import valid JSON with proper validation', async () => {
      const now = new Date().toISOString();
      
      const validJSON = JSON.stringify({
        _meta: {
          version: '1.0.0',
          timestamp: now,
          source: 'test'
        },
        meta: [{ 
          id: 'meta',  // Exact string required by schema
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now
        }],
        world: [],
        layers: [],
        entities: [],
        relations: [],
        timelines: [],
        styles: [],
        imports: [],
        ai: [],
        views: [],
        history: []
      });

      const result = await importService.loadFromJSON(validJSON);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid JSON format', async () => {
      const invalidJSON = '{ invalid json content }';
      
      const result = await importService.loadFromJSON(invalidJSON);
      
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject empty JSON', async () => {
      const result = await importService.loadFromJSON('');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('vide ou invalide');
    });

    it('should validate schema structure', async () => {
      // Missing required fields
      const incompleteJSON = JSON.stringify({
        meta: []
        // Missing other required collections
      });
      
      const result = await importService.loadFromJSON(incompleteJSON);
      
      expect(result.success).toBe(false);
    });

    it('should handle version warnings', async () => {
      const now = new Date().toISOString();
      
      const oldVersionJSON = JSON.stringify({
        _meta: {
          version: '0.9.0', // Old version
          timestamp: now,
          source: 'test'
        },
        meta: [{ 
          id: 'meta',  // Exact string required by schema
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now
        }],
        world: [],
        layers: [],
        entities: [],
        relations: [],
        timelines: [],
        styles: [],
        imports: [],
        ai: [],
        views: [],
        history: []
      });

      const result = await importService.loadFromJSON(oldVersionJSON);
      
      expect(result.success).toBe(true);
    });
  });

  describe('File operations', () => {
    it('should handle file type validation', async () => {
      // Create a mock non-JSON file
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' }) as any;
      
      const result = await importService.loadFromFile(mockFile);
      
      expect(result.success).toBe(false);
    });

    it('should handle missing file gracefully', async () => {
      // @ts-ignore - Testing with null file
      const result = await importService.loadFromFile(null);
      
      expect(result.success).toBe(false);
    });

    it('devrait importer arda3.json ou un export Arda complet sans rejet de schéma', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const arda3Path = path.resolve(process.cwd(), 'arda3.json');
      if (fs.existsSync(arda3Path)) {
        const raw = fs.readFileSync(arda3Path, 'utf-8');
        const res = await importService.loadFromJSON(raw);
        if (!res.success) {
          console.log('REJET IMPORT ARDA3.JSON:', res.errors);
        }
        expect(res.success).toBe(true);
      }
    });
  });
});

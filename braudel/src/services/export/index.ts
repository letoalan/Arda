import { DatabaseSchema } from '../../core/schema';
import * as db from '../persistence/indexeddb';

// Interface pour les métadonnées d'export
interface ExportMetadata {
  version: string;
  timestamp: string;
  source: 'indexeddb' | 'store';
}

// Structure canonique du fichier d'export
interface CanonicalExport extends DatabaseSchema {
  _meta: ExportMetadata;
}

/**
 * Exporte toutes les données depuis IndexedDB en JSON canonique
 */
export const exportFromIndexedDB = async (): Promise<string> => {
  try {
    await db.openDB();
    
    // Récupérer toutes les collections de la base
    const data: DatabaseSchema = {
      meta: await db.getAll('meta'),
      world: await db.getAll('world'),
      layers: await db.getAll('layers'),
      entities: await db.getAll('entities'),
      relations: await db.getAll('relations'),
      timelines: await db.getAll('timelines'),
      styles: await db.getAll('styles'),
      imports: await db.getAll('imports'),
      ai: await db.getAll('ai'),
      views: await db.getAll('views'),
      history: await db.getAll('history')
    };

    // Créer la structure d'export canonique avec métadonnées
    const canonicalExport: CanonicalExport = {
      _meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        source: 'indexeddb'
      },
      ...data
    };

    // Retourner le JSON formaté
    return JSON.stringify(canonicalExport, null, 2);
  } catch (error) {
    throw new Error(`Erreur d'export depuis IndexedDB : ${(error as Error).message}`);
  }
};

/**
 * Exporte les données du store applicatif en JSON canonique
 */
export const exportFromStore = (data: DatabaseSchema): string => {
  try {
    // Créer la structure d'export canonique avec métadonnées
    const canonicalExport: CanonicalExport = {
      _meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        source: 'store'
      },
      ...data
    };

    // Retourner le JSON formaté
    return JSON.stringify(canonicalExport, null, 2);
  } catch (error) {
    throw new Error(`Erreur d'export depuis le store : ${(error as Error).message}`);
  }
};

/**
 * Déclenche un téléchargement de fichier JSON
 */
export const downloadJSON = (jsonContent: string, filename: string = 'braudel-world'): void => {
  try {
    // Créer un blob avec le contenu JSON
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    // Générer une URL temporaire pour le téléchargement
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement invisible
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${Date.now()}.json`;
    link.style.display = 'none';
    
    // Ajouter le lien au DOM et cliquer dessus
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer : supprimer le lien et révoquer l'URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Erreur de téléchargement : ${(error as Error).message}`);
  }
};

/**
 * Export complet avec téléchargement automatique
 */
export const exportAndDownload = async (): Promise<void> => {
  try {
    // Récupérer les données depuis IndexedDB (ou store si échec)
    let jsonContent: string;
    
    try {
      jsonContent = await exportFromIndexedDB();
    } catch {
      // Si erreur avec IndexedDB, utiliser le store applicatif
      throw new Error('Impossible d\'accéder à la base de données');
    }
    
    // Déclencher le téléchargement
    downloadJSON(jsonContent);
  } catch (error) {
    console.error('Erreur lors de l\'export :', error);
    throw error;
  }
};

// Export par défaut pour compatibilité
export const exportToJSON = (data: DatabaseSchema): string => {
  return JSON.stringify(data, null, 2);
};

export default {
  exportFromIndexedDB,
  exportFromStore,
  downloadJSON,
  exportAndDownload,
  exportToJSON
};

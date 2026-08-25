// services/import/index.ts

import { validateAndParseJSON, ImportResult } from './importValidator';
import { synchronizeImport } from './importSyncer';

export type { ImportResult };
export { synchronizeImport };

export const loadFromFile = async (file: File): Promise<ImportResult> => {
  return new Promise<ImportResult>((resolve, reject) => {
    if (!file || file.type !== 'application/json') {
      resolve({
        success: false,
        errors: ['Le fichier doit être au format JSON']
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const result = await validateAndParseJSON(raw);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(`Import impossible : ${result.errors?.join(', ') || 'Erreur de validation'}`));
        }
      } catch (error) {
        reject(new Error(`Import impossible : ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        errors: [`Erreur lecture fichier : ${reader.error?.message || 'Inconnue'}`]
      });
    };
    
    reader.readAsText(file);
  });
};

export const loadFromJSON = async (raw: string): Promise<ImportResult> => {
  try {
    return await validateAndParseJSON(raw);
  } catch (error) {
    return {
      success: false,
      errors: [`Import JSON impossible : ${(error as Error).message}`]
    };
  }
};

export const importFromFile = async (file: File): Promise<ImportResult> => {
  const result = await loadFromFile(file);
  if (result.success && result.data) {
    await synchronizeImport(result.data);
  }
  return result;
};

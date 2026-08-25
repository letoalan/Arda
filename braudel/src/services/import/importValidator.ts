// services/import/importValidator.ts

import { DatabaseSchema, validateDatabase } from '../../core/schema';

export interface ImportResult {
  success: boolean;
  data?: DatabaseSchema;
  errors?: string[];
  warnings?: string[];
}

export async function validateAndParseJSON(raw: string): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'string') {
    return {
      success: false,
      errors: ['Le contenu est vide ou invalide']
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (parseError) {
    return {
      success: false,
      errors: [`Erreur de parsing JSON : ${(parseError as Error).message}`]
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      errors: ['La structure doit être un objet JSON']
    };
  }

  const requiredSections = [
    'meta', 'world', 'layers', 'entities', 'relations', 
    'timelines', 'styles', 'imports', 'ai', 'views', 'history'
  ];

  let missingSections = 0;
  for (const section of requiredSections) {
    if (!(section in parsed)) {
      missingSections++;
    } else if (!Array.isArray(parsed[section])) {
      errors.push(`La section '${section}' doit être un tableau`);
    }
  }

  if (missingSections > 5) {
    return {
      success: false,
      errors: ['Structure de schéma invalide : trop de collections manquantes']
    };
  }

  for (const section of requiredSections) {
    if (!(section in parsed)) {
      warnings.push(`Section manquante '${section}', initialisée vide`);
      parsed[section] = [];
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings
    };
  }

  if (validateDatabase(parsed)) {
    return {
      success: true,
      data: parsed,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } else {
    return {
      success: false,
      errors: ['Incompatibilité de schéma de base de données'],
      warnings
    };
  }
}

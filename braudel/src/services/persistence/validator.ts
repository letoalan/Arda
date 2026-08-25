import { validateDatabase, DatabaseSchema } from '../../core/schema';

export const validateData = (data: unknown): DatabaseSchema => {
  if (!validateDatabase(data)) {
    throw new Error('Validation échouée : données non conformes au schéma canonique');
  }
  return data as DatabaseSchema;
};

export const validateAndParse = (raw: string): DatabaseSchema => {
  try {
    const parsed = JSON.parse(raw);
    // validateData already returns DatabaseSchema if successful
    return validateData(parsed);
  } catch (error) {
    throw new Error(`Parsing ou validation échouée : ${(error as Error).message}`);
  }
};

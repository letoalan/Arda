import { DatabaseSchema } from '../../core/schema';

export const serializeDatabase = (data: DatabaseSchema): string => {
  try {
    return JSON.stringify(data, null, 2); // Pretty print for readability
  } catch (error) {
    throw new Error(`Erreur de sérialisation de la base de données : ${(error as Error).message}`);
  }
};

export default {
  serializeDatabase
};

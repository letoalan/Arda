import { ArdaDoc, CURRENT_ARDA_SCHEMA_VERSION } from './bento-types';

/**
 * Résultat d'une validation de document ArdaDoc.
 */
export interface ArdaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  doc?: ArdaDoc;
}

/**
 * Extrait et parse le document ArdaDoc contenu dans un fichier HTML exporté.
 */
export function parseArdaDocFromHtml(htmlContent: string): ArdaDoc {
  if (!htmlContent || typeof htmlContent !== 'string') {
    throw new Error('Le contenu HTML fourni est vide ou invalide.');
  }

  const scriptMatch = htmlContent.match(/<script type="application\/arda\+json"[^>]*id="arda-doc"[^>]*>([\s\S]*?)<\/script>/i)
    || htmlContent.match(/<script[^>]*id="arda-doc"[^>]*type="application\/arda\+json"[^>]*>([\s\S]*?)<\/script>/i);

  if (!scriptMatch || !scriptMatch[1]) {
    throw new Error('Balise <script type="application/arda+json" id="arda-doc"> introuvable dans le fichier HTML.');
  }

  try {
    const rawJson = scriptMatch[1].trim();
    const doc = JSON.parse(rawJson);
    return doc as ArdaDoc;
  } catch (err: any) {
    throw new Error(`Échec du parsing JSON du document ArdaDoc : ${err.message}`);
  }
}

/**
 * Valide la structure minimale d'un document ArdaDoc.
 */
export function validateArdaDocSchema(doc: any): ArdaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Le document est nul ou n\'est pas un objet JSON valide.'], warnings };
  }

  if (doc.format !== 'arda/map-story') {
    errors.push(`Format inconnu : "${doc.format}". Attendu : "arda/map-story".`);
  }

  if (!doc.title || typeof doc.title !== 'string') {
    warnings.push('Le document ne contient pas de titre explicite.');
  }

  if (!doc.map || typeof doc.map !== 'object') {
    errors.push('La configuration cartographique (map) est absente.');
  } else {
    if (!doc.map.styleUrl && !doc.map.styleId) {
      warnings.push('Ni styleUrl ni styleId ne sont renseignés pour la carte.');
    }
  }

  if (!doc.timeline || typeof doc.timeline !== 'object') {
    warnings.push('La timeline est absente, initialisation par défaut.');
  }

  if (!Array.isArray(doc.waypoints)) {
    errors.push('La liste des waypoints est absente ou invalide.');
  }

  if (!Array.isArray(doc.slides)) {
    warnings.push('Aucun tableau de diapositives défini.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    doc: errors.length === 0 ? (doc as ArdaDoc) : undefined,
  };
}

/**
 * Effectue la migration ascendante d'un document ArdaDoc vers la version courante.
 */
export function migrateArdaDoc(rawDoc: any): ArdaDoc {
  const validation = validateArdaDocSchema(rawDoc);
  if (!validation.valid) {
    throw new Error(`Impossible de migrer un document invalide : ${validation.errors.join(', ')}`);
  }

  const doc = { ...rawDoc };

  // 1. Initialisation de la version du schéma
  if (!doc.schemaVersion) {
    doc.schemaVersion = CURRENT_ARDA_SCHEMA_VERSION;
  }

  // 2. Migration de la configuration de terrain (Chantier 2)
  if (doc.map && !doc.map.terrain) {
    doc.map.terrain = {
      mode: 'none',
      terrainTilesUrl: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
      encoding: 'mapbox',
      exaggeration: 1.2,
      hillshadeEnabled: true,
    };
  }

  // 3. Migration des slides et des éléments (Chantier 5)
  if (Array.isArray(doc.slides)) {
    doc.slides = doc.slides.map((s: any, sIdx: number) => {
      const slide = { ...s };
      slide.id = slide.id || `slide-${sIdx + 1}`;
      slide.title = slide.title || `Diapositive ${sIdx + 1}`;
      slide.returnBehavior = slide.returnBehavior || 'same-waypoint';
      slide.elements = Array.isArray(slide.elements)
        ? slide.elements.map((el: any, elIdx: number) => ({
            id: el.id || `el-${elIdx + 1}`,
            type: el.type || 'text',
            content: el.content || el.text || '',
            url: el.url || el.src || undefined,
            title: el.title || undefined,
            ...el,
          }))
        : [];
      return slide;
    });
  } else {
    doc.slides = [];
  }

  // 4. Migration des GeoJSONs
  if (!doc.entitiesGeoJSON) {
    doc.entitiesGeoJSON = { type: 'FeatureCollection', features: [] };
  }
  if (!doc.relationsGeoJSON) {
    doc.relationsGeoJSON = { type: 'FeatureCollection', features: [] };
  }

  return doc as ArdaDoc;
}

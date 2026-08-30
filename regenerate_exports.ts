import * as fs from 'fs';
import * as path from 'path';
import { generateStandaloneHtml } from './braudel/src/services/export/standalone-template';
import { STYLE_CONFIGS } from './braudel/src/core/styles.config';

const ardaDocPath = path.resolve('arda3.json');
const ardaDoc = JSON.parse(fs.readFileSync(ardaDocPath, 'utf8'));
const styleConfig = STYLE_CONFIGS.find(s => s.id === ardaDoc.map?.styleId) || STYLE_CONFIGS[0];

const html = generateStandaloneHtml(
  ardaDoc.title || 'Arda3',
  styleConfig,
  ardaDoc.entitiesGeoJSON,
  ardaDoc.relationsGeoJSON,
  'story',
  undefined,
  ardaDoc,
  ardaDoc.map
);

fs.writeFileSync(path.resolve('arda3.html'), html, 'utf8');
fs.writeFileSync(path.resolve('arda4.html'), html, 'utf8');
console.log('Fichiers arda3.html et arda4.html régénérés avec succès.');

// services/export/standalone-template.ts

import { StyleConfig } from '../../core/styles.config';
import { StoryProject } from '../../core/schema/story';
import { getStandaloneStyles } from './standaloneStyles';
import { getStandaloneScript } from './standaloneScripts';

export type StandaloneExportMode = 'map' | 'story';

export function generateStandaloneHtml(
  worldName: string,
  styleConfig: StyleConfig,
  entitiesGeoJSON: any,
  relationsGeoJSON: any,
  mode: StandaloneExportMode = 'map',
  storyProject?: StoryProject
): string {
  const isDark = styleConfig.id.includes('dark') || styleConfig.id.includes('cyberpunk') || styleConfig.id.includes('space_opera') || styleConfig.id.includes('tolkine');
  const bgPanel = isDark ? 'rgba(15, 17, 21, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const accentColor = styleConfig.id.includes('tolkien') ? '#D97706' : '#3B82F6';

  const storyJsonString = storyProject ? JSON.stringify(storyProject) : 'null';
  const cssStyles = getStandaloneStyles(styleConfig, isDark, bgPanel, textColor, borderColor, accentColor);
  const jsScript = getStandaloneScript(styleConfig, entitiesGeoJSON, relationsGeoJSON, mode, storyJsonString);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${worldName} — ${mode === 'story' ? 'Récit Cartographique Bento' : 'Visualisation interactive Braudel'}</title>
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>${cssStyles}</style>
</head>
<body>
  <div id="map"></div>

  ${mode === 'story' ? `
  <div class="bento-container">
    <div class="bento-card">
      <div class="bento-header">
        <span class="badge-era" id="scene-year">---</span>
        <span style="font-size: 0.8rem; opacity: 0.7;" id="scene-idx">1 / 1</span>
      </div>
      <h2 id="scene-title" style="margin: 0 0 10px 0; font-size: 1.2rem;">${worldName}</h2>
      <p id="scene-text" style="margin: 0; font-size: 0.9rem; line-height: 1.5; opacity: 0.85;"></p>
      
      <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid ${borderColor};">
        <button className="btn-nav" id="btn-prev">← Précédent</button>
        <button className="btn-nav" id="btn-next">Suivant →</button>
      </div>
    </div>
  </div>
  ` : `
  <div class="panel-simple" id="time-slider">
    <h2 style="margin: 0 0 6px 0; font-size: 1.1rem;">${worldName}</h2>
    <p style="margin: 0; font-size: 0.8rem; opacity: 0.75;">Fond : ${styleConfig.name}</p>
  </div>
  `}

  <div id="wiki-modal" class="wiki-modal">
    <button class="wiki-close-btn" id="wiki-close-btn">×</button>
    <h3 id="wiki-title" style="margin-top: 0; font-size: 1.2rem;"></h3>
    <div id="wiki-body" style="font-size: 0.9rem; line-height: 1.6; margin-top: 12px; white-space: pre-wrap;"></div>
  </div>

  <script>${jsScript}</script>
</body>
</html>`;
}

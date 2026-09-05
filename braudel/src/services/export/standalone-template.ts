import { StyleConfig } from '../../core/styles.config';
import { StoryProject } from '../../core/schema/story';
import { getStandaloneStyles } from './standaloneStyles';
import { getStandaloneScript } from './standaloneScripts';
import { ArdaDoc, convertStoryProjectToArdaDoc } from './modules/bento-types';

export type StandaloneExportMode = 'map' | 'story';

export function normalizeEntitiesGeoJSON(rawEntitiesGeoJSON: any): any {
  if (!rawEntitiesGeoJSON || !Array.isArray(rawEntitiesGeoJSON.features)) {
    return rawEntitiesGeoJSON || { type: 'FeatureCollection', features: [] };
  }

  const normalizedFeatures = rawEntitiesGeoJSON.features.map((f: any) => {
    const props = { ...(f.properties || {}) };

    // Extraction de la plage temporelle (support direct, temporalRange objet ou tableau)
    if (props.validFrom === undefined && f.temporalRange) {
      if (typeof f.temporalRange.validFrom === 'number') {
        props.validFrom = f.temporalRange.validFrom;
      } else if (Array.isArray(f.temporalRange) && typeof f.temporalRange[0] === 'number') {
        props.validFrom = f.temporalRange[0];
      }
    }
    if (props.validTo === undefined && f.temporalRange) {
      if (typeof f.temporalRange.validTo === 'number') {
        props.validTo = f.temporalRange.validTo;
      } else if (Array.isArray(f.temporalRange) && typeof f.temporalRange[1] === 'number') {
        props.validTo = f.temporalRange[1];
      }
    }

    // Extraction des couleurs et styles
    const color = props.color || f.color || '#3B82F6';
    props.color = color;
    props.fillColor = props.fillColor || color;
    props.strokeColor = props.strokeColor || color;
    props.fillOpacity = typeof props.fillOpacity === 'number' ? props.fillOpacity : 0.45;
    props.strokeOpacity = typeof props.strokeOpacity === 'number' ? props.strokeOpacity : 0.85;
    props.lineWidth = typeof props.lineWidth === 'number' ? props.lineWidth : 1.5;
    props.name = props.name || f.name || 'Entité';
    props.wikiContent = props.wikiContent || f.wikiContent || props.description || f.description || '';

    return {
      ...f,
      type: 'Feature',
      properties: props,
    };
  });

  return {
    ...rawEntitiesGeoJSON,
    type: 'FeatureCollection',
    features: normalizedFeatures,
  };
}

export function generateStandaloneHtml(
  worldName: string,
  styleConfig: StyleConfig,
  entitiesGeoJSON: any,
  relationsGeoJSON: any,
  mode: StandaloneExportMode = 'map',
  storyProject?: StoryProject,
  customArdaDoc?: ArdaDoc,
  mapOptions?: {
    geoReferenceLinesVisible?: boolean;
    portulanRhumbVisible?: boolean;
    graticuleVisible?: boolean;
    basemapLabelsVisible?: boolean;
    basemapBordersVisible?: boolean;
    basemapRoadsVisible?: boolean;
    basemapRiversVisible?: boolean;
    pitch?: number;
    projection?: 'mercator' | 'globe' | 'eckert4';
  }
): string {
  const isDark = true;
  const bgPanel = 'rgba(23, 26, 33, 0.85)';
  const textColor = '#E2E8F0';
  const borderColor = '#2D3748';
  const accentColor = styleConfig.id.includes('tolkien') ? '#D97706' : '#3B82F6';

  const normalizedEntities = normalizeEntitiesGeoJSON(entitiesGeoJSON);
  const normalizedRelations = relationsGeoJSON || { type: 'FeatureCollection', features: [] };

  const ardaDoc: ArdaDoc = customArdaDoc || convertStoryProjectToArdaDoc(
    worldName,
    styleConfig,
    normalizedEntities,
    normalizedRelations,
    storyProject,
    mapOptions
  );

  const ardaDocJsonString = JSON.stringify(ardaDoc);
  const cssStyles = getStandaloneStyles(styleConfig, isDark, bgPanel, textColor, borderColor, accentColor);
  const jsScript = getStandaloneScript(styleConfig, normalizedEntities, normalizedRelations, mode, ardaDocJsonString);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ardaDoc.title} — Carte-Récit Interactive Braudel</title>
  <script src="https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.css" rel="stylesheet" />
  <style>${cssStyles}</style>
</head>
<body>
  <!-- Badge Brand Arda Flottant Supérieur Gauche -->
  <div class="top-brand-badge" id="top-brand-badge">
    <span class="brand-logo">🗺️</span>
    <span class="brand-name">${ardaDoc.title || 'Arda'}</span>
    <span class="brand-tag">Bento</span>
  </div>

  <!-- Barre d'outils supérieure unifiée -->
  <div class="top-toolbar-group" id="present-toolbar">
    <button class="tool-btn" id="btn-toggle-theme" title="Basculer Mode Sombre / Clair (D)">
      <span id="icon-theme">🌙</span>
    </button>
    <div class="toolbar-divider"></div>
    <button class="tool-btn" id="btn-toggle-sidecar" title="Basculer Mode Sidecar Docké / Volet Flottant (Mode EX)">
      <span id="icon-sidecar">📑</span> Sidecar (EX)
    </button>
    <button class="tool-btn" id="btn-toggle-orientation" title="Basculer Orientation Sidecar : Horizontal / Vertical (O)" style="display: none;">
      <span id="icon-orientation">⇄</span> Orientation
    </button>
    <div class="toolbar-divider"></div>
    <button class="tool-btn" id="btn-toggle-legend" title="Afficher la Légende Dynamique (L)">
      <span>🗺️</span> Légende
    </button>
    <button class="tool-btn" id="btn-recenter-step" title="Recadrer la vue sur l'étape active (C / Raccord)">
      <span>🎯</span> Centrer
    </button>
    <div class="toolbar-divider"></div>
    <button class="tool-btn" id="btn-present" title="Mode Plein Écran / Projection en classe (F5 / P)">
      <span>📺</span> Plein Écran (F5)
    </button>
    <button class="tool-btn tool-btn-accent" id="btn-save-deck" title="Sauvegarder le document (Ctrl+S)">
      <span>💾</span> Sauvegarder
    </button>
  </div>

  <!-- Conteneur Principal de Disposition (Mode Normal / Mode EX Sidecar Docked) -->
  <div class="app-layout-root" id="app-layout-root">
    <!-- Panneau Narratif Docké Défilant (Mode EX Sidecar ArcGIS) -->
    <aside class="sidecar-narrative-panel" id="sidecar-narrative-panel" style="display: none;">
      <div class="sidecar-narrative-header">
        <div class="sidecar-header-brand">
          <span class="badge-era" id="sidecar-world-title">${ardaDoc.title || 'Arda'}</span>
          <span class="sidecar-progress-count" id="sidecar-progress-count">1 / 1</span>
        </div>
        <button class="tool-btn" id="btn-sidecar-timeline-overview" title="Vue d'ensemble chronologique">
          <span>⏱️</span> Frise
        </button>
      </div>

      <!-- Ruban Chronologique Vertical Intégré au Scroll (Phase 7) -->
      <div class="sidecar-vertical-progress-track">
        <div class="sidecar-vertical-progress-bar" id="sidecar-vertical-progress-bar"></div>
      </div>

      <!-- Liste Défilante des Étapes & Arguments Scrollytelling -->
      <div class="sidecar-scroll-content" id="sidecar-scroll-content"></div>
    </aside>

    <!-- Zone Cartographique Principale -->
    <main class="main-map-stage" id="main-map-stage">
      <!-- Canevas Cartographique MapLibre GL -->
      <div id="map"></div>

      <!-- Mini-Carte de Contexte Fixe Macro / Continentale (Phase 5) -->
      <div class="context-minimap-box" id="context-minimap-box" title="Mini-carte de contexte (cliquer pour alterner vue générale macro / continentale)">
        <div class="context-minimap-header">
          <span>🌍 Vue Générale</span>
          <span class="context-minimap-badge" id="context-minimap-scale">Macro</span>
        </div>
        <div id="context-minimap-canvas" style="width: 100%; height: 100%;"></div>
        <div class="context-minimap-indicator" id="context-minimap-indicator"></div>
      </div>
    </main>
  </div>

  <!-- Tiroir de Légende Latéral Escamotable -->
  <aside class="legend-drawer hidden" id="legend-drawer">
    <div class="legend-drawer-header">
      <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
        <span>🗺️</span> Légende Dynamique
      </h3>
      <button class="btn-close-drawer" id="btn-close-legend" title="Fermer la légende (L)">&times;</button>
    </div>
    <div class="legend-drawer-body" id="legend-content"></div>
  </aside>

  <!-- Volet Narratif Bento Flottant (Mode Story Classique) -->
  <div class="bento-container" id="bento-overlay">
    <div class="bento-card">
      <!-- Barre de progression visuelle globale du récit -->
      <div class="bento-story-progress-wrapper" title="Progression dans le récit">
        <div class="bento-story-progress-bar" id="bento-story-progress"></div>
      </div>

      <div class="bento-header">
        <div class="bento-header-left">
          <span class="badge-era" id="scene-year">---</span>
          <span class="bento-world-tag">${ardaDoc.title || 'Arda'}</span>
        </div>
        <div class="bento-header-right">
          <span class="scene-counter" id="scene-idx">1 / 1</span>
        </div>
      </div>
      
      <div class="bento-body-wrapper">
        <h2 id="scene-title" class="bento-title">${ardaDoc.title}</h2>
        <p id="scene-text" class="bento-body"></p>
      </div>
      
      <!-- Miniature Diapositive d'Appui Interactive (Slide Preview) -->
      <div class="bento-slide-preview-card" id="bento-slide-preview-box" style="display: none;">
        <div class="preview-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.8rem; color: #f59e0b;">★</span>
            <span class="preview-badge">Diapositive d'appui</span>
          </div>
          <span class="preview-expand-hint">Plein écran ↗</span>
        </div>
        <div class="preview-canvas-scaled" id="bento-mini-slide-canvas">
          <div class="mini-slide-grid" id="bento-mini-slide-grid"></div>
        </div>
      </div>

      <div class="bento-actions-row">
        <button class="btn-slide-trigger btn-slide-primary" id="btn-open-slide" title="Projeter la diapositive d'appui en plein écran (M)">
          <span>★</span> Diapositive
        </button>
        <button class="btn-slide-trigger btn-edit-trigger" id="btn-edit-slide-bento" title="Éditer la composition graphique de cette étape (E)">
          <span>✏️</span> Éditer
        </button>
      </div>

      <div class="bento-nav-row">
        <button class="btn-nav" id="btn-prev" title="Étape précédente (Flèche Gauche)">
          ← Précédent
          <span class="nav-preview-tooltip" id="tooltip-prev-title"></span>
        </button>
        <button class="btn-nav btn-nav-primary" id="btn-next" title="Étape suivante (Flèche Droite)">
          Suivant →
          <span class="nav-preview-tooltip" id="tooltip-next-title"></span>
        </button>
      </div>
    </div>
  </div>

  <!-- Timeline Spatio-Temporelle Inférieure Premium Style Arda (Play/Pause, Vitesse, Eras) -->
  <div class="timeline-bar-container" id="bento-timeline-bar">
    <div class="timeline-header-info">
      <div class="timeline-left-controls">
        <button class="btn-timeline-play" id="btn-timeline-play" title="Lecture / Pause spatio-temporelle (Espace)">
          <span id="icon-timeline-play">▶</span>
        </button>
        <select class="timeline-speed-select" id="timeline-speed-select" title="Vitesse de défilement">
          <option value="1">1 an/s</option>
          <option value="5" selected>5 ans/s</option>
          <option value="10">10 ans/s</option>
          <option value="25">25 ans/s</option>
        </select>
        <button class="btn-timeline-jump" id="btn-timeline-prev-epoch" title="Étape précédente (◀)">◀</button>
        <button class="btn-timeline-jump" id="btn-timeline-next-epoch" title="Étape suivante (▶)">▶</button>
      </div>

      <div class="timeline-center-control">
        <span class="timeline-current-badge" id="timeline-current-year-badge">
          <span style="font-size: 0.85rem;">⏱️</span> <span id="lbl-active-year">---</span>
        </span>
      </div>

      <div class="timeline-right-controls">
        <div class="timeline-edge-label" id="lbl-start-year">-500</div>
        <span class="timeline-edge-separator">→</span>
        <div class="timeline-edge-label" id="lbl-end-year">500</div>
        <button class="btn-toggle-timeline-labels" id="btn-toggle-labels" title="Déplier / Replier l'axe des dates détaillées (T)">
          <span>🏷️</span> <span id="lbl-toggle-text">Dates</span>
        </button>
      </div>
    </div>

    <!-- Mini-légende des grandes ères historiques -->
    <div class="timeline-eras-legend">
      <span class="era-pill era-antiquity"><span class="era-dot" style="background:#3B82F6;"></span> Antiquité</span>
      <span class="era-pill era-medieval"><span class="era-dot" style="background:#10B981;"></span> Moyen Âge</span>
      <span class="era-pill era-modern"><span class="era-dot" style="background:#F59E0B;"></span> Ép. Moderne</span>
      <span class="era-pill era-contemporary"><span class="era-dot" style="background:#EC4899;"></span> Ép. Contemporaine</span>
    </div>
    
    <div class="timeline-track-wrapper" id="timeline-track">
      <div class="timeline-progress-fill" id="timeline-progress"></div>
      <input type="range" class="timeline-slider" id="timeline-slider" min="0" max="100" value="0">
    </div>

    <!-- Ruban d'étiquettes de dates escamotable / expansible sur 1 seule ligne nette -->
    <div class="timeline-ticks-container" id="timeline-ticks-bar"></div>
  </div>

  <!-- Vue Diapositive d'Appui Plein Écran Overlay (Slide Container) -->
  <div class="slide-container hidden" id="slide-container">
    <div class="slide-content-wrapper" id="slide-content-wrapper">
      <div class="slide-topbar">
        <div>
          <span class="badge-era" style="margin-right: 10px;">DIAPOSITIVE D'APPUI</span>
          <h1 id="slide-title" style="display: inline-block; margin: 0; font-size: 1.6rem; vertical-align: middle;">Titre de la Diapositive</h1>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="tool-btn" id="btn-slide-split-mode" title="Basculer Mode Écran Partagé : Diapo Seule / Split 50-50 / Minicarte PIP (S)">
            <span id="icon-split-mode">⬓</span> Écran Partagé
          </button>
          <button class="tool-btn" id="btn-edit-current-slide" style="background: var(--accent-color); color: #fff; border: none;" title="Éditer cette diapositive (Style PowerPoint)">
            <span>✏️</span> Éditer la Diapositive
          </button>
          <button class="slide-close-btn" id="btn-slide-close" style="position: static; width: 34px; height: 34px; font-size: 1rem; margin-left: 6px;" title="Fermer la diapositive (Échap / M)">✕</button>
        </div>
      </div>
      
      <div class="slide-viewport-frame" id="slide-viewport-frame">
        <div class="slide-main-stage" id="slide-main-stage">
          <div class="slide-canvas" id="slide-canvas">
            <div class="slide-grid" id="slide-grid"></div>
          </div>
        </div>

        <!-- Conteneur Split 50/50 pour la carte -->
        <div class="slide-split-map-panel hidden" id="slide-split-map-panel">
          <div class="split-map-header">
            <span>🗺️ Vue Géographique Synchronisée</span>
          </div>
          <div id="slide-split-map-container" style="flex: 1; width: 100%; height: 100%;"></div>
        </div>
      </div>

      <!-- Minicarte PIP Incrustée en bas à droite -->
      <div class="slide-pip-minimap hidden" id="slide-pip-minimap" title="Minicarte de repérage (cliquer pour agrandir)">
        <div class="pip-minimap-header"><span>🗺️ Repère</span></div>
        <div id="slide-pip-map-canvas" style="width: 100%; height: 100%;"></div>
      </div>

      <div class="slide-speaker-notes" id="slide-speaker-notes" style="display: none;"></div>
    </div>
  </div>

  <!-- Modal Éditeur de Diapositive Autonome Intégré (Type PowerPoint / OpenOffice) -->
  <div class="slide-editor-overlay hidden" id="slide-editor-modal">
    <div class="slide-editor-window">
      <!-- Ruban d'outils supérieur -->
      <div class="slide-editor-ribbon">
        <div class="ribbon-title-section">
          <span style="font-size: 1.2rem;">📽️</span>
          <div>
            <h3 style="margin:0; font-size: 1rem;" id="editor-modal-slide-title">Éditeur de Diapositive</h3>
            <span style="font-size: 0.7rem; opacity: 0.6;">Format 16:9 • Prêt pour projection</span>
          </div>
        </div>

        <div class="ribbon-tools-group">
          <button class="ribbon-btn" id="btn-editor-add-title" title="Ajouter Titre"><span>🔤</span> Titre</button>
          <button class="ribbon-btn" id="btn-editor-add-text" title="Ajouter Texte"><span>📄</span> Texte</button>
          <button class="ribbon-btn" id="btn-editor-add-image" title="Ajouter Image"><span>🖼️</span> Image</button>
          <button class="ribbon-btn" id="btn-editor-add-video" title="Ajouter Vidéo (YouTube / MP4)"><span>🎬</span> Vidéo</button>
          <button class="ribbon-btn" id="btn-editor-add-diagram" title="Ajouter Schéma"><span>📊</span> Schéma</button>
          <button class="ribbon-btn" id="btn-editor-add-rect" title="Ajouter Rectangle"><span>⬛</span> Rectangle</button>
          <button class="ribbon-btn" id="btn-editor-add-circle" title="Ajouter Cercle"><span>⚪</span> Cercle</button>
          <button class="ribbon-btn" id="btn-editor-add-arrow" title="Ajouter Flèche Stratégique"><span>➡️</span> Flèche</button>
          <button class="ribbon-btn" id="btn-editor-add-pill" title="Ajouter Bannière / Cartouche"><span>🏷️</span> Bannière</button>
          <button class="ribbon-btn" id="btn-editor-toggle-ratio" title="Basculer le format d'aspect (9:16 Portrait / 16:9 Paysage)"><span>📱</span> Ratio: <strong id="editor-ratio-label">9:16 Portrait</strong></button>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="tool-btn" id="btn-editor-save" style="background: var(--accent-color); color: #fff; border: none; font-weight: 600;">
            ✓ Enregistrer
          </button>
          <button class="slide-close-btn" id="btn-editor-close" style="position: static; width: 34px; height: 34px; font-size: 1rem;">✕</button>
        </div>
      </div>

      <!-- Espace de composition central -->
      <div class="slide-editor-workspace">
        <!-- Canevas interactif 16:9 -->
        <div class="slide-editor-canvas-wrapper" id="editor-canvas-wrapper">
          <div class="slide-editor-canvas-stage" id="editor-canvas-stage">
            <div class="editor-grid-guide"></div>
            <!-- Guides magnétiques d'alignement dynamique (Type PowerPoint) -->
            <div class="editor-align-guide editor-align-guide-x hidden" id="guide-center-x"></div>
            <div class="editor-align-guide editor-align-guide-y hidden" id="guide-center-y"></div>
          </div>
        </div>

        <!-- Inspecteur de propriétés et Panneau de Calques latéral -->
        <div class="slide-editor-inspector" id="editor-inspector">
          <!-- Sélecteur d'onglets (Propriétés / Calques) -->
          <div class="editor-tabs-header">
            <button class="editor-tab-btn active" id="tab-btn-properties"><span>🎨</span> Propriétés</button>
            <button class="editor-tab-btn" id="tab-btn-layers"><span>📑</span> Calques</button>
          </div>

          <!-- Onglet 1 : Propriétés & Format -->
          <div id="tab-panel-properties" class="editor-tab-panel active">
            <div id="inspector-content" style="display: flex; flex-direction: column; gap: 12px;">
              <p style="font-size: 0.8rem; opacity: 0.6; font-style: italic;">
                Sélectionnez un élément sur la diapositive pour le modifier ou le repositionner.
              </p>
            </div>
            <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <label style="font-size: 0.75rem; opacity: 0.8; display: block; margin-bottom: 4px;">Couleur de fond du slide</label>
              <input type="color" id="editor-slide-bgcolor" value="#1e293b" style="width: 100%; height: 30px; border: none; cursor: pointer; border-radius: 4px;">
            </div>
          </div>

          <!-- Onglet 2 : Calques & Ordre d'empilement -->
          <div id="tab-panel-layers" class="editor-tab-panel">
            <div class="layers-toolbar">
              <span style="font-size: 0.75rem; font-weight: 600; opacity: 0.8;">Ordre d'empilement</span>
              <div style="display: flex; gap: 4px;">
                <button class="layer-tool-btn" id="btn-layer-top" title="Placer au premier plan">▲▲</button>
                <button class="layer-tool-btn" id="btn-layer-up" title="Monter d'un niveau">▲</button>
                <button class="layer-tool-btn" id="btn-layer-down" title="Descendre d'un niveau">▼</button>
                <button class="layer-tool-btn" id="btn-layer-bottom" title="Placer à l'arrière-plan">▼▼</button>
              </div>
            </div>
            <div id="layers-list-container" class="layers-list"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modale Fiche Wiki Encyclopedique -->
  <div id="wiki-modal" class="wiki-modal">
    <button class="wiki-close-btn" id="wiki-close-btn">×</button>
    <h3 id="wiki-title" style="margin-top: 0; font-size: 1.2rem;"></h3>
    <div id="wiki-body" style="font-size: 0.9rem; line-height: 1.6; margin-top: 12px; white-space: pre-wrap;"></div>
  </div>

  <!-- Document ArdaDoc Sérialisé -->
  <script type="application/arda+json" id="arda-doc">${ardaDocJsonString}</script>

  <!-- Moteur d'Exécution Client -->
  <script>${jsScript}</script>
</body>
</html>`;
}

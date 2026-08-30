/**
 * Styles CSS pour la timeline, les diapositives d'appui, le mode présentation, la légende et la modale Wiki.
 */
export function getStandaloneSlideStyles(isDark: boolean): string {
  return `
    /* Vue Diapositive d'Appui Plein Écran (Overlay Superposé Style Arda) */
    .slide-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 50;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-y: auto;
      padding: 24px;
    }
    .slide-container.hidden { display: none; }
    .slide-close-btn {
      position: absolute;
      top: 20px;
      right: 24px;
      z-index: 52;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, background 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .slide-close-btn:hover {
      transform: scale(1.1);
      background: var(--accent-color);
      color: white;
    }
    .slide-content-wrapper {
      position: relative;
      width: 96vw;
      max-width: 1400px;
      height: 92vh;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .slide-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    /* Cadre de projection 16:9 épousant strictement le canevas utile 960x540 */
    .slide-viewport-frame {
      position: relative;
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 0;
      overflow: hidden;
    }
    .slide-main-stage {
      position: relative;
      max-width: 100%;
      max-height: 100%;
      background: ${isDark ? '#0b0f19' : '#0f172a'};
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: width 0.2s ease, height 0.2s ease;
    }
    .slide-canvas {
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      background: transparent;
      background-size: cover !important;
      background-position: center !important;
      border-radius: inherit;
      transform-origin: top left;
    }
    .slide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      padding: 24px;
      height: 100%;
      box-sizing: border-box;
      overflow-y: auto;
    }
    .slide-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .slide-card img { 
      max-width: 100%; 
      max-height: 240px; 
      object-fit: contain; 
      border-radius: 8px; 
      margin-top: 4px; 
    }
    .slide-element-absolute {
      position: absolute;
      box-sizing: border-box;
      border-radius: 8px;
      overflow: hidden;
    }
    .slide-element-absolute img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: inherit;
    }

    /* Styles pour les schémas / diagrammes connectés par flèches (Point 5) */
    .diagram-flow-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .diagram-flow-nodes {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      width: 100%;
    }
    .diagram-flow-node {
      background: rgba(59, 130, 246, 0.25);
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      text-align: center;
    }
    .diagram-flow-arrow {
      color: #38bdf8;
      font-size: 1.1rem;
      font-weight: bold;
      animation: pulse 2s infinite;
    }

    /* Mode Écran Partagé 50/50 Carte Réelle & Slide (Point 2) */
    .slide-container.slide-split-active {
      width: 50vw;
      right: auto;
      left: 0;
      padding: 16px;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: transparent;
      pointer-events: none;
    }
    .slide-container.slide-split-active .slide-content-wrapper {
      width: 100%;
      height: 100%;
      pointer-events: auto;
      box-shadow: 8px 0 32px rgba(0,0,0,0.5);
    }
    .slide-split-mode .slide-main-stage {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      aspect-ratio: 16 / 9;
    }
    .slide-split-map-panel { display: none !important; }

    /* Mode EX : Superposition de Diapositive au-dessus du Sidecar (Format Portrait 3:4 / 9:16) */
    body.mode-ex-active .slide-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 38%;
      min-width: 360px;
      max-width: 540px;
      height: 100vh;
      z-index: 60;
      background: ${isDark ? 'rgba(15, 17, 21, 0.98)' : 'rgba(255, 255, 255, 0.99)'};
      border-right: 1px solid var(--border-color);
      box-shadow: 12px 0 40px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    body.mode-ex-active .slide-container.hidden {
      display: none !important;
    }
    body.mode-ex-active.sidecar-slide-expanded .slide-container {
      width: 48%;
      max-width: 680px;
    }

    body.mode-ex-active .slide-content-wrapper {
      width: 100%;
      max-width: 100%;
      height: 100%;
      border-radius: 0;
      border: none;
      box-shadow: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      background: ${isDark ? '#0b0f19' : '#0f172a'};
    }
    body.mode-ex-active .slide-topbar {
      padding: 10px 16px;
      margin-bottom: 0;
      background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      z-index: 10;
    }
    body.mode-ex-active .slide-viewport-frame {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 0;
      margin: 0;
      background: ${isDark ? '#0b0f19' : '#0f172a'};
    }

    /* Rendu Dynamique Homothétique Edge-to-Edge dans le Volet Sidecar */
    body.mode-ex-active .slide-main-stage {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 0;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: ${isDark ? '#0b0f19' : '#0f172a'};
    }
    body.mode-ex-active .slide-canvas {
      border-radius: inherit;
    }
    body.mode-ex-active .slide-grid {
      grid-template-columns: 1fr;
      padding: 16px;
      gap: 12px;
    }

    body.mode-ex-active #slide-title {
      font-size: 1.15rem !important;
    }
    body.mode-ex-active #btn-slide-split-mode {
      display: none !important;
    }

    /* Sidecar Slide Overlay en orientation verticale (Carte en haut, Diapositive en bas) */
    body.mode-ex-active.mode-ex-vertical .slide-container {
      width: 100vw;
      min-width: 100vw;
      max-width: 100vw;
      height: 46vh;
      top: auto;
      bottom: 0;
      border-right: none;
      border-top: 1px solid var(--border-color);
    }
    body.mode-ex-active.mode-ex-vertical .slide-main-stage {
      width: 480px;
      max-width: 90vw;
      aspect-ratio: 16 / 9;
    }

    /* Éditeur de Diapositive Plein Écran Universel */
    body.mode-ex-active .slide-editor-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 85;
      padding: 16px;
      background: rgba(10, 15, 29, 0.94);
      backdrop-filter: blur(18px);
    }

    /* Timeline compacte en mode écran partagé */
    body.slide-split-mode-active .timeline-bar-container {
      left: calc(50vw + 24px);
      width: calc(50vw - 48px);
      max-width: calc(50vw - 48px);
      transform: none;
    }
    body.slide-split-mode-active .bento-container {
      display: none;
    }

    /* Minicarte PIP Incrustée en Coin */
    .slide-pip-minimap {
      position: absolute;
      bottom: 24px;
      right: 24px;
      width: 180px;
      height: 180px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--accent-color);
      box-shadow: 0 12px 36px rgba(0,0,0,0.6);
      z-index: 50;
      background: #000;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .slide-pip-minimap:hover {
      transform: scale(1.06);
    }
    .slide-pip-minimap.hidden { display: none; }
    .pip-minimap-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      padding: 4px 8px;
      font-size: 0.68rem;
      font-weight: 600;
      z-index: 2;
    }

    /* Guides Magnétiques d'Alignement Visuel (Style PowerPoint) */
    .editor-align-guide {
      position: absolute;
      pointer-events: none;
      z-index: 30;
      background: #ef4444;
    }
    .editor-align-guide-x {
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
    }
    .editor-align-guide-y {
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
    }
    .editor-align-guide.hidden { display: none; }

    .slide-speaker-notes {
      margin-top: 14px;
      padding: 10px 16px;
      background: ${isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)'};
      border-left: 4px solid var(--accent-color);
      border-radius: 4px;
      font-size: 0.82rem;
      font-style: italic;
      flex-shrink: 0;
    }

    /* Tiroir de Légende Latéral Escamotable */
    .legend-drawer {
      position: absolute;
      top: 0;
      right: 0;
      height: 100vh;
      width: 320px;
      max-width: 85vw;
      background: var(--bg-panel);
      backdrop-filter: blur(16px);
      border-left: 1px solid var(--border-color);
      box-shadow: -10px 0 30px rgba(0,0,0,0.25);
      z-index: 45;
      display: flex;
      flex-direction: column;
      transform: translateX(0);
      transition: transform 0.3s ease;
    }
    .legend-drawer.hidden {
      transform: translateX(100%);
      pointer-events: none;
    }
    .legend-drawer-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .legend-drawer-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .btn-close-drawer {
      background: transparent;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
    }

    /* Mode Présentation (F5) */
    body.present-mode .top-toolbar { display: none; }
    body.present-mode .bento-container {
      top: auto;
      bottom: 90px;
      width: min(600px, calc(100vw - 32px));
    }
    body.present-mode .timeline-bar-container { bottom: 12px; opacity: 0.9; }

    /* Modale Wiki */
    .wiki-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 540px;
      max-height: 80vh;
      overflow-y: auto;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      backdrop-filter: blur(16px);
      z-index: 100;
      display: none;
    }
    .wiki-modal.open { display: block; }
    .wiki-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: transparent;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      font-size: 1.4rem;
    }

    /* Modal Éditeur de Diapositive Embarqué (Style PowerPoint / OpenOffice) */
    .slide-editor-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 15, 29, 0.94);
      backdrop-filter: blur(18px);
      z-index: 80;
      display: flex;
      flex-direction: column;
      padding: 16px;
      box-sizing: border-box;
    }
    .slide-editor-overlay.hidden { display: none; }
    .slide-editor-window {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
    }
    .slide-editor-ribbon {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      background: ${isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(241, 245, 249, 0.95)'};
      border-bottom: 1px solid var(--border-color);
      gap: 12px;
    }
    .ribbon-title-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ribbon-tools-group {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      padding: 3px;
      border-radius: 8px;
      gap: 4px;
    }
    .ribbon-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-color);
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .ribbon-btn:hover {
      background: var(--accent-color);
      color: #fff;
    }
    .slide-editor-workspace {
      display: flex;
      flex: 1;
      min-height: 0;
      gap: 14px;
      padding: 14px;
      background: ${isDark ? '#090d16' : '#e2e8f0'};
    }
    .slide-editor-canvas-wrapper {
      flex: 1;
      position: relative;
      background: ${isDark ? '#0b0f19' : '#cbd5e1'};
      border-radius: 10px;
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }
    /* Surface de Création Noir Portrait 9:16 dans l'Éditeur Plein Écran */
    .slide-editor-canvas-stage {
      position: relative;
      width: 960px;
      height: 540px;
      max-width: 100%;
      max-height: 100%;
      background-color: #1e293b;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    body.mode-ex-active .slide-editor-canvas-stage {
      width: 540px;
      height: 960px;
      max-height: 95%;
      aspect-ratio: 9 / 16;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15);
    }
    .editor-grid-guide {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .slide-editor-element {
      position: absolute;
      box-sizing: border-box;
      cursor: grab;
      user-select: none;
    }
    .slide-editor-element.dragging {
      cursor: grabbing;
    }
    .slide-editor-element.selected {
      outline: 2px solid var(--accent-color);
      outline-offset: 1px;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
    }

    /* 8 Poignées de redimensionnement interactives (Style PowerPoint) */
    .resize-handle {
      position: absolute;
      width: 9px;
      height: 9px;
      background: #ffffff;
      border: 1.5px solid var(--accent-color);
      border-radius: 2px;
      z-index: 20;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .handle-nw { top: -5px; left: -5px; cursor: nwse-resize; }
    .handle-n  { top: -5px; left: calc(50% - 4.5px); cursor: ns-resize; }
    .handle-ne { top: -5px; right: -5px; cursor: nesw-resize; }
    .handle-e  { top: calc(50% - 4.5px); right: -5px; cursor: ew-resize; }
    .handle-se { bottom: -5px; right: -5px; cursor: nwse-resize; }
    .handle-s  { bottom: -5px; left: calc(50% - 4.5px); cursor: ns-resize; }
    .handle-sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
    .handle-w  { top: calc(50% - 4.5px); left: -5px; cursor: ew-resize; }

    /* Onglets de la barre latérale de l'inspecteur */
    .slide-editor-inspector {
      width: 320px;
      background: var(--bg-panel);
      border-radius: 10px;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .editor-tabs-header {
      display: flex;
      background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'};
      border-bottom: 1px solid var(--border-color);
    }
    .editor-tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-color);
      padding: 10px 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0.7;
      transition: all 0.15s ease;
    }
    .editor-tab-btn:hover { opacity: 1; }
    .editor-tab-btn.active {
      opacity: 1;
      border-bottom-color: var(--accent-color);
      color: var(--accent-color);
      background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)'};
    }
    .editor-tab-panel {
      display: none;
      flex: 1;
      padding: 14px;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .editor-tab-panel.active {
      display: flex;
    }

    /* Panneau de Calques & Empilement */
    .layers-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }
    .layer-tool-btn {
      background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: bold;
      cursor: pointer;
    }
    .layer-tool-btn:hover {
      background: var(--accent-color);
      color: #fff;
    }
    .layers-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .layer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.78rem;
      transition: all 0.15s ease;
    }
    .layer-item:hover {
      border-color: var(--accent-color);
      background: ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
    }
    .layer-item.active {
      border-color: var(--accent-color);
      background: ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'};
      font-weight: 600;
    }
    .layer-item.locked {
      opacity: 0.6;
    }
    .layer-item-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .layer-icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .layer-icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }

    .inspector-field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .inspector-label {
      font-size: 0.72rem;
      opacity: 0.8;
      font-weight: 600;
    }
    .inspector-input {
      width: 100%;
      padding: 6px 8px;
      font-size: 0.8rem;
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      border-radius: 6px;
    }
  `;
}

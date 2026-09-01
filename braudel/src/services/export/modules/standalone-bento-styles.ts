import { StyleConfig } from '../../../core/styles.config';

/**
 * Feuille de style principale de l'export Bento HTML autonome.
 * Intègre le Design System officiel d'Arda (Dark Mode profond, Glassmorphism, Inter font,
 * Frise spatio-temporelle interactive, volets narratifs et support du thème clair).
 */
export function getStandaloneBentoStyles(
  styleConfig: StyleConfig,
  _isDark: boolean,
  bgPanel: string,
  _textColor: string,
  _borderColor: string,
  accentColor: string
): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      /* Palette Sombre Officielle Arda */
      --bg-primary: #0F1115;
      --bg-secondary: #171A21;
      --bg-tertiary: #1E222B;
      --bg-card: rgba(23, 26, 33, 0.88);
      --bg-panel: ${bgPanel};

      --text-primary: #E2E8F0;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --text-color: var(--text-primary);

      --border-color: #2D3748;
      --border-subtle: rgba(255, 255, 255, 0.08);

      --accent-primary: #3B82F6;
      --accent-hover: #2563EB;
      --accent-color: ${accentColor || '#3B82F6'};
      --accent-gold: #F59E0B;
      --accent-success: #10B981;
      --accent-danger: #EF4444;

      /* Glassmorphism Arda */
      --glass-bg: rgba(23, 26, 33, 0.85);
      --glass-border: rgba(255, 255, 255, 0.09);
      --glass-blur: blur(14px);
      --glass-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.06) inset;

      --btn-bg: rgba(255, 255, 255, 0.07);
      --btn-bg-hover: rgba(255, 255, 255, 0.14);

      --font-family: ${styleConfig?.fontFamily ? `${styleConfig.fontFamily}, ` : ''}'Inter', system-ui, -apple-system, sans-serif;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
    }

    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* Scrollbars Arda */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-primary);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: var(--radius-sm);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }

    /* ==========================================================================
       THEME CLAIR (OPTIONNEL VIA BOUTON ☀️ / 🌙)
       ========================================================================== */
    body.light-theme {
      --bg-primary: #F8FAFC !important;
      --bg-secondary: #FFFFFF !important;
      --bg-tertiary: #F1F5F9 !important;
      --bg-card: rgba(255, 255, 255, 0.95) !important;
      --bg-panel: rgba(255, 255, 255, 0.94) !important;

      --text-primary: #0F172A !important;
      --text-secondary: #475569 !important;
      --text-muted: #64748B !important;
      --text-color: #0F172A !important;

      --border-color: rgba(0, 0, 0, 0.12) !important;
      --border-subtle: rgba(0, 0, 0, 0.08) !important;

      --glass-bg: rgba(255, 255, 255, 0.92) !important;
      --glass-border: rgba(0, 0, 0, 0.1) !important;
      --glass-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;

      --btn-bg: #F1F5F9 !important;
      --btn-bg-hover: #E2E8F0 !important;
      background-color: #F8FAFC !important;
      color: #0F172A !important;
    }

    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      transition: opacity 0.3s ease;
    }
    #map.hidden {
      opacity: 0;
      pointer-events: none;
    }

    /* ==========================================================================
       BRAND BADGE FLOTTANT ARDA (HAUT GAUCHE)
       ========================================================================== */
    .top-brand-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 6px 14px;
      box-shadow: var(--glass-shadow);
      user-select: none;
      pointer-events: auto;
    }
    .brand-logo {
      font-size: 1.1rem;
    }
    .brand-name {
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }
    .brand-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(59, 130, 246, 0.2);
      color: #60A5FA;
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 4px;
      padding: 1px 6px;
    }

    /* ==========================================================================
       BARRE D'OUTILS SUPÉRIEURE FLOTTANTE (HAUT DROITE)
       ========================================================================== */
    .top-toolbar-group {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 30;
      display: flex;
      gap: 3px;
      align-items: center;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 4px 6px;
      box-shadow: var(--glass-shadow);
    }
    .toolbar-divider {
      width: 1px;
      height: 18px;
      background: var(--border-color);
      margin: 0 4px;
    }
    .tool-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-primary);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }
    .tool-btn:hover {
      background: var(--btn-bg-hover);
      border-color: var(--border-subtle);
      color: #FFFFFF;
    }
    body.light-theme .tool-btn:hover {
      color: #0F172A;
    }
    .tool-btn-accent {
      background: var(--accent-primary) !important;
      color: #FFFFFF !important;
      border-color: var(--accent-primary) !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }
    .tool-btn-accent:hover {
      background: var(--accent-hover) !important;
      opacity: 0.95;
    }

    /* ==========================================================================
       VOLET NARRATIF BENTO FLOTTANT (DESIGN SYSTEM ARDA)
       ========================================================================== */
    .bento-container {
      position: absolute;
      top: 68px;
      left: 16px;
      width: 390px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 190px);
      z-index: 20;
      display: flex;
      flex-direction: column;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .bento-card {
      pointer-events: auto;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }

    /* Responsive Mobile / Tablette */
    @media (max-width: 768px), (max-aspect-ratio: 1/1) {
      .top-brand-badge {
        top: 12px;
        left: 12px;
        padding: 4px 10px;
      }
      .top-toolbar-group {
        top: 12px;
        right: 12px;
      }
      .bento-container {
        top: auto;
        bottom: 96px;
        left: 10px;
        right: 10px;
        width: auto;
        max-width: none;
        max-height: 44vh;
      }
      .bento-card {
        padding: 14px;
        max-height: 44vh;
      }
      .timeline-bar-container {
        left: 10px;
        right: 10px;
        bottom: 10px;
      }
    }

    /* Barre de progression de la carte de récit */
    .bento-story-progress-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--border-subtle);
      border-top-left-radius: var(--radius-lg);
      border-top-right-radius: var(--radius-lg);
      overflow: hidden;
    }
    .bento-story-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3B82F6, #60A5FA);
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bento-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .bento-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }
    .badge-era {
      background: var(--accent-primary);
      color: #FFFFFF;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.35);
      flex-shrink: 0;
    }
    .bento-world-tag {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .scene-counter {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
      background: var(--btn-bg);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .bento-body-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bento-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.35;
      color: var(--text-primary);
      letter-spacing: -0.015em;
    }
    .bento-body {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.6;
      color: #CBD5E1;
      opacity: 0.95;
    }
    body.light-theme .bento-body {
      color: #334155 !important;
    }

    /* Miniature Diapositive d'Appui Interactive */
    .bento-slide-preview-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .bento-slide-preview-card:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.72rem;
    }
    .preview-badge {
      font-weight: 600;
      color: var(--accent-gold);
    }
    .preview-expand-hint {
      opacity: 0.8;
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .preview-canvas-scaled {
      position: relative;
      width: 100%;
      height: 130px;
      background-color: var(--bg-tertiary);
      overflow: hidden;
      user-select: none;
    }
    .mini-slide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
      gap: 6px;
      padding: 6px;
      height: 100%;
      box-sizing: border-box;
    }
    .mini-slide-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 6px;
      font-size: 0.65rem;
      color: var(--text-primary);
      overflow: hidden;
    }

    .bento-actions-row {
      display: flex;
      gap: 8px;
    }
    .btn-slide-trigger {
      flex: 1;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
    }
    .btn-slide-primary {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid var(--accent-primary);
      color: #60A5FA;
    }
    .btn-slide-primary:hover {
      background: var(--accent-primary);
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }
    .btn-edit-trigger {
      background: var(--btn-bg);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    .btn-edit-trigger:hover {
      background: var(--btn-bg-hover);
      border-color: var(--text-muted);
    }

    .bento-nav-row {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid var(--border-subtle);
      gap: 8px;
      position: relative;
    }
    .btn-nav {
      flex: 1;
      position: relative;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-nav:hover {
      background: var(--btn-bg-hover);
      border-color: var(--text-muted);
    }
    .btn-nav-primary {
      background: var(--accent-primary) !important;
      color: #FFFFFF !important;
      border-color: var(--accent-primary) !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
    }
    .btn-nav-primary:hover {
      background: var(--accent-hover) !important;
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .btn-nav:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .nav-preview-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 17, 21, 0.95);
      color: #F8FAFC;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 10;
    }
    .btn-nav:hover .nav-preview-tooltip:not(:empty) {
      opacity: 1;
    }

    /* ==========================================================================
       TIMELINE SPATIO-TEMPORELLE INFÉRIEURE ARDA (FRISES, JUMPS & ERAS)
       ========================================================================== */
    .timeline-bar-container {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      z-index: 25;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 10px 16px;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.25s ease;
    }

    .timeline-header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .timeline-left-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-timeline-play {
      background: var(--accent-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.35);
    }
    .btn-timeline-play:hover {
      background: var(--accent-hover);
      transform: scale(1.05);
    }
    .timeline-speed-select {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 3px 6px;
      font-size: 0.72rem;
      font-family: var(--font-family);
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .btn-timeline-jump {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.7rem;
      transition: all 0.15s ease;
    }
    .btn-timeline-jump:hover {
      background: var(--btn-bg-hover);
      border-color: var(--text-muted);
    }

    .timeline-center-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .timeline-current-badge {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 3px 12px;
      font-weight: 700;
      font-size: 0.84rem;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .timeline-right-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .timeline-edge-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .timeline-edge-separator {
      color: var(--text-muted);
      font-size: 0.7rem;
      opacity: 0.6;
    }
    .btn-toggle-timeline-labels {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      padding: 3px 8px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .btn-toggle-timeline-labels:hover {
      background: var(--btn-bg-hover);
      color: var(--text-primary);
    }

    /* Légende des grandes ères historiques */
    .timeline-eras-legend {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      padding: 2px 0;
    }
    .era-pill {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 5px;
      user-select: none;
    }
    .era-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }

    /* Piste du Slider */
    .timeline-track-wrapper {
      position: relative;
      width: 100%;
      height: 16px;
      display: flex;
      align-items: center;
    }
    .timeline-progress-fill {
      position: absolute;
      left: 0;
      top: 5px;
      height: 6px;
      background: linear-gradient(90deg, #3B82F6, #60A5FA);
      border-radius: 3px;
      pointer-events: none;
      z-index: 2;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    }
    .timeline-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      outline: none;
      margin: 0;
      z-index: 3;
      cursor: pointer;
      position: relative;
    }
    .timeline-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 3px solid var(--accent-primary);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 6px rgba(59, 130, 246, 0.5);
      transition: transform 0.15s ease;
    }
    .timeline-slider::-webkit-slider-thumb:hover {
      transform: scale(1.25);
    }
    .timeline-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 3px solid var(--accent-primary);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 6px rgba(59, 130, 246, 0.5);
      transition: transform 0.15s ease;
    }

    .timeline-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-primary);
      border: 2px solid var(--bg-primary);
      z-index: 4;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      padding: 0;
    }
    .timeline-marker:hover {
      transform: translate(-50%, -50%) scale(1.4);
      box-shadow: 0 0 10px var(--accent-primary);
    }
    .timeline-marker.has-slide {
      border-color: var(--accent-gold);
    }

    .timeline-ticks-container {
      position: relative;
      width: 100%;
      height: 16px;
      overflow: hidden;
      display: none;
    }
    .timeline-ticks-container.expanded {
      display: block;
    }
    .timeline-tick-label {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
    }
    .timeline-tick-label:hover {
      color: var(--text-primary);
    }

    /* ==========================================================================
       TIROIR DE LÉGENDE DYNAMIQUE (LATÉRAL DROIT)
       ========================================================================== */
    .legend-drawer {
      position: absolute;
      top: 68px;
      right: 16px;
      width: 320px;
      max-height: calc(100vh - 190px);
      z-index: 28;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 16px;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    .legend-drawer.hidden {
      display: none !important;
    }
    .legend-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .btn-close-drawer {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .btn-close-drawer:hover {
      color: var(--text-primary);
    }

    /* ==========================================================================
       MODE EX : SIDECAR DOCKED NARRATIF
       ========================================================================== */
    .app-layout-root {
      width: 100vw;
      height: 100vh;
      display: flex;
      position: relative;
      overflow: hidden;
    }
    .main-map-stage {
      flex: 1;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }

    body.mode-ex-active .bento-container {
      display: none !important;
    }
    body.mode-ex-active #sidecar-narrative-panel {
      display: flex !important;
    }
    body.mode-ex-active #btn-toggle-orientation {
      display: flex !important;
    }

    .sidecar-narrative-panel {
      width: 38%;
      min-width: 360px;
      max-width: 540px;
      height: 100vh;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 25;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }
    .sidecar-narrative-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-tertiary);
      flex-shrink: 0;
    }
    .sidecar-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidecar-progress-count {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
      background: var(--btn-bg);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .sidecar-vertical-progress-track {
      position: absolute;
      left: 0;
      top: 54px;
      bottom: 0;
      width: 4px;
      background: var(--border-subtle);
      z-index: 10;
    }
    .sidecar-vertical-progress-bar {
      width: 100%;
      height: 0%;
      background: linear-gradient(180deg, var(--accent-primary), #60A5FA);
      transition: height 0.2s ease-out;
      box-shadow: 0 0 8px var(--accent-primary);
    }
    .sidecar-scroll-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-snap-type: y proximity;
      padding: 20px 24px 90px 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .narrative-step-card {
      scroll-snap-align: start;
      background: var(--glass-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px;
      transition: all 0.25s ease;
      position: relative;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
    .narrative-step-card:hover {
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }
    .narrative-step-card.active-step {
      border-color: var(--accent-primary);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25), 0 0 0 1px var(--accent-primary) inset;
      background: var(--bg-tertiary);
    }

    /* Mini-Carte de Contexte Fixe Flottant au-dessus de la Timeline */
    .context-minimap-box {
      position: absolute;
      bottom: 96px;
      right: 20px;
      width: 145px;
      height: 145px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      z-index: 20;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @media (max-width: 768px) {
      .context-minimap-box {
        display: none !important;
      }
    }
    .context-minimap-box:hover {
      transform: scale(1.05);
      border-color: var(--accent-primary);
      box-shadow: 0 12px 32px rgba(59, 130, 246, 0.35);
    }
    .context-minimap-box.is-continental-view,
    .context-minimap-box.is-macro-expanded {
      width: 220px;
      height: 220px;
      border-color: var(--accent-primary);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
    }
    .context-minimap-box.is-continental-view:hover,
    .context-minimap-box.is-macro-expanded:hover {
      transform: scale(1.02);
    }
    .context-minimap-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 4px 8px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.68rem;
      font-weight: 700;
      z-index: 2;
    }
    .context-minimap-badge {
      color: var(--accent-primary);
      font-size: 0.62rem;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.03em;
      transition: color 0.2s ease;
    }
    .context-minimap-box.is-continental-view .context-minimap-badge,
    .context-minimap-box.is-macro-expanded .context-minimap-badge {
      color: #10B981;
    }
    .context-minimap-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #EF4444;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 10px #EF4444;
      pointer-events: none;
      z-index: 3;
      transition: left 0.1s ease-out, top 0.1s ease-out;
    }
    .context-minimap-box.is-continental-view .context-minimap-indicator,
    .context-minimap-box.is-macro-expanded .context-minimap-indicator {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 12px #EF4444;
    }

    body.mode-ex-vertical .app-layout-root {
      flex-direction: column;
    }
    body.mode-ex-vertical .sidecar-narrative-panel {
      width: 100vw;
      min-width: 100vw;
      max-width: 100vw;
      height: 46vh;
      border-right: none;
      border-top: 1px solid var(--border-color);
      order: 2;
    }
    body.mode-ex-vertical .main-map-stage {
      height: 54vh;
      width: 100vw;
      order: 1;
    }
  `;
}

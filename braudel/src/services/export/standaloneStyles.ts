// services/export/standaloneStyles.ts

import { StyleConfig } from '../../core/styles.config';

export function getStandaloneStyles(styleConfig: StyleConfig, isDark: boolean, bgPanel: string, textColor: string, borderColor: string, accentColor: string): string {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: ${styleConfig.fontFamily || 'system-ui, sans-serif'};
      background-color: ${isDark ? '#0b0f19' : '#f3f4f6'};
      color: ${textColor};
    }
    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .panel-simple {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
      background: ${bgPanel};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      padding: 18px;
      width: 320px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(12px);
    }
    .bento-container {
      position: absolute;
      top: 20px;
      left: 20px;
      bottom: 20px;
      width: 380px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .bento-card {
      pointer-events: auto;
      background: ${bgPanel};
      border: 1px solid ${borderColor};
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.35);
      backdrop-filter: blur(16px);
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .bento-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${borderColor};
    }
    .badge-era {
      background: ${accentColor};
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .btn-nav {
      background: ${accentColor};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn-nav:hover { opacity: 0.9; }
    .btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
    .wiki-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 540px;
      max-height: 80vh;
      overflow-y: auto;
      background: ${bgPanel};
      border: 1px solid ${borderColor};
      border-radius: 12px;
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
      color: ${textColor};
      cursor: pointer;
      font-size: 1.2rem;
    }
    .wikilink {
      color: ${accentColor};
      text-decoration: underline;
      cursor: pointer;
      font-weight: 500;
    }
  `;
}

# Spécification Technique & Documentation : Bento & Styles Autonomes

## Vue d'Ensemble
Le module `standalone-bento-styles.ts` génère l'ensemble des règles CSS et des tokens de design pour l'export HTML autonome Bento d'Arda.

## Architecture & Éléments de Design
- **Design System Arda Officiel & Vrai Mode Sombre par Défaut** :
  - **Tokens de Couleur** : Fond sombre profond (`--bg-primary: #0F1115`, `--bg-secondary: #171A21`, `--bg-tertiary: #1E222B`), bordures contrastées (`--border-color: #2D3748`, `--border-subtle: rgba(255, 255, 255, 0.08)`), typographie *Inter* (`--text-primary: #E2E8F0`, `--text-secondary: #94A3B8`, `--text-muted: #64748B`), et accents vifs (`--accent-primary: #3B82F6`, `--accent-gold: #F59E0B`).
  - **Glassmorphism & Profondeur** : Arrière-plans translucides avec `backdrop-filter: blur(14px)` et ombres diffuses `0 16px 36px rgba(0, 0, 0, 0.5)`.
  - **Brand Badge Supérieur Gauche** : Badge flottant `.top-brand-badge` affichant le logo cartographique, le nom de l'univers et le chip `Bento`.
  - **Barre d'Outils Supérieure Flottante** : Groupe `.top-toolbar-group` avec bascule Thème Sombre / Clair (`🌙` / `☀️`), mode Sidecar (EX), Légende, Raccord et Projection plein écran.
  - **Volet Narratif Bento** : Carte flottante `.bento-card` avec barre de progression de récit, badges d'ères colorés, titre percutant et actions interactives.
  - **Frise Chronologique Spatio-Temporelle Inférieure** : Bandeau étendu `.timeline-bar-container` intégrant le bouton de lecture automatique `▶ / ⏸` (avec raccourci clavier *Espace*), sélecteur de vitesse (`1 an/s`, `5 ans/s`, `10 ans/s`), sauts d'étapes (◀ / ▶), badge d'année active et légende des ères.
  - **Mini-Carte Macro Découplée de la Timeline** : Positionnée à `bottom: 96px; right: 20px;` pour éviter tout chevauchement avec la frise et libérer le bouton `🏷️ Dates`.
  - **Contraste Rehaussé des Lignes de Rhumb** : Lignes maîtresses à `1.5px` (`opacity: 0.80`) et secondaires à `0.9px` (`opacity: 0.55`) avec pastilles dorées de rayon 7px.
  - **Support du Thème Clair** : Classe `.light-theme` assurant un rendu lumineux tout aussi soigné sur commande.
- Disposition du canevas cartographique plein écran `#map`.
- **Mode EX — Sidecar Pédagogique Docké (`body.mode-ex-active`)** :
  - Partitionnement fixe sans chevauchement : Panneau narratif à gauche (38%) + Carte WebGL à droite (62%).
  - Bascule d'orientation (`body.mode-ex-vertical`) : Carte en haut (54%) et panneau narratif en bas (46%).
  - Règle de sécurité anti-débordement dynamique (`.sidecar-narrative-panel.narrative-expanded`) pour textes longs (> 500 caractères).
  - Cartes d'argumentation de type dissertation avec badges de parties (`.narrative-part-badge`), ruban chronologique vertical (`.sidecar-vertical-progress-track`), actions de texte interactives (`.map-action-trigger`) et mini-carte de repère macro (`.context-minimap-box`).
- Miniature de diapositive intégrée en direct dans le volet Bento (`.bento-slide-preview-card`, `.preview-canvas-scaled`) avec agrandissement direct au clic.

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **standalone-bento-styles.md**



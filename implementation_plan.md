# Refonte Visuelle de l'Export Bento & Vrai Mode Sombre Style Arda

Ce document détaille la conception et le plan d'implémentation pour doter l'export autonome Bento HTML d'un **vrai mode sombre par défaut** et d'une **refonte graphique complète** calquée sur l'identité visuelle et le design system d'Arda.

---

## 1. Objectifs & Philosophie de Design

L'export Bento HTML autonome doit offrir une expérience visuelle et ergonomique identique à celle de l'application Arda :
1. **Thème Sombre Arda par Défaut** : Palette officielle d'Arda (`#0F1115`, `#171A21`, `#1E222B`, `#2D3748`, `#E2E8F0`, accents `#3B82F6` et `#F59E0B`) avec glassmorphism (`backdrop-filter: blur(14px)`), bordures subtiles (`rgba(255, 255, 255, 0.08)`) et ombres diffuses.
2. **Basculement Dynamique Sombre / Clair** : Le bouton `🌙` / `☀️` permet de basculer instantanément entre le mode sombre profond Arda et un mode clair épuré.
3. **Cartes Bento & Volets Flottants Style Arda** :
   - Coins arrondis `12px` / `16px`, typographie *Inter* moderne, en-têtes avec chips d'ères colorées.
   - Boutons d'actions avec micro-animations et retours haptiques visuels (`.btn-primary`, `.btn-secondary`, `.btn-icon`).
4. **Frise Chronologique Spatio-Temporelle Inférieure** :
   - Structure calquée sur la frise d'Arda : bandeau sombre compact, contrôles de lecture `▶ / ⏸`, sélecteur de vitesse (`1 an/s`, `10 ans/s`), badge d'ère et curseur de progression lumineux.
5. **Barre d'Outils Flottante Supérieure & Tiroir de Légende** :
   - Style pilule flottante translucide en haut à droite avec icônes nettes et infobulles élégantes.

---

## 2. Modifications Proposées

### Component: Export Bento & Styles Autonomes

#### [MODIFY] [standalone-bento-styles.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-bento-styles.ts)
- Remplacement des variables CSS par le design token system complet d'Arda :
  - `--bg-primary: #0F1115`
  - `--bg-secondary: #171A21`
  - `--bg-tertiary: #1E222B`
  - `--border-color: #2D3748`
  - `--text-primary: #E2E8F0`
  - `--text-secondary: #94A3B8`
  - `--text-muted: #64748B`
  - `--accent-primary: #3B82F6`
  - `--glass-bg: rgba(23, 26, 33, 0.82)`
  - `--glass-border: rgba(255, 255, 255, 0.08)`
  - `--glass-shadow: 0 16px 36px rgba(0, 0, 0, 0.4)`
- Refonte des cartes `.bento-card`, de la barre d'outils `.top-toolbar-group`, du tiroir `.legend-drawer`, et des boutons de navigation.
- Définition propre de la classe `.light-theme` pour le mode clair.

#### [MODIFY] [standalone-slide-styles.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-styles.ts)
- Harmonisation du mode Présentation plein écran et du mode Écran partagé avec les tokens du mode sombre Arda.
- Uniformisation des poignées de redimensionnement et des barres d'outils de l'éditeur de diapositives.

#### [MODIFY] [standalone-template.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standalone-template.ts)
- Activation du mode sombre par défaut (`isDark = true` standard).
- Mise à jour du balisage HTML de la timeline inférieure pour inclure les boutons de lecture/pause et la structure de l'interface Arda.
- Alignement des classes et de la hiérarchie visuelle.

#### [MODIFY] [standalone-timeline-logic.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-timeline-logic.ts)
- Intégration de la boucle d'animation automatique (Play/Pause `▶ / ⏸`) et synchronisation continue avec les waypoints et le slider.

---

## 3. Plan de Vérification

### Tests Automatisés
- Exécution de la suite complète Vitest : `npx vitest run` (163+ tests).
- Validation TypeScript : `npx tsc --noEmit`.

### Vérification Manuelle & Visuelle
- Régénération des exports : `npx tsx regenerate_exports.ts` (`arda3.html` et `arda4.html`).
- Contrôle de la bascule Thème Sombre / Clair (`🌙` / `☀️`).
- Vérification du rendu de la carte Bento, des boutons, de la frise inférieure et des calques géographiques/rhumbs.

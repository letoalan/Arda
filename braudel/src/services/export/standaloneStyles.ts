import { StyleConfig } from '../../core/styles.config';
import { getStandaloneBentoStyles } from './modules/standalone-bento-styles';
import { getStandaloneSlideStyles } from './modules/standalone-slide-styles';

/**
 * Générateur central de la feuille de style intégrée pour l'export HTML autonome.
 */
export function getStandaloneStyles(
  styleConfig: StyleConfig,
  isDark: boolean,
  bgPanel: string,
  textColor: string,
  borderColor: string,
  accentColor: string
): string {
  const bentoStyles = getStandaloneBentoStyles(styleConfig, isDark, bgPanel, textColor, borderColor, accentColor);
  const slideStyles = getStandaloneSlideStyles(isDark);
  return `${bentoStyles}\n${slideStyles}`;
}

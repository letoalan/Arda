// core/styles/realStyles.ts

import type { StyleConfig } from '../styles.config';
import { HISTORICAL_STYLE_CONFIGS } from './realStylesHistorical';
import { CONTEMPORARY_STYLE_CONFIGS } from './realStylesContemporary';

export const REAL_STYLE_CONFIGS: StyleConfig[] = [
  ...HISTORICAL_STYLE_CONFIGS,
  ...CONTEMPORARY_STYLE_CONFIGS
];

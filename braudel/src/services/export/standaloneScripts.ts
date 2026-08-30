import { StyleConfig } from '../../core/styles.config';
import { getStandaloneMapInitScript } from './modules/standalone-map-init';
import { getStandaloneTimelineScript } from './modules/standalone-timeline-logic';
import { getStandaloneSlideScript } from './modules/standalone-slide-logic';

/**
 * Générateur principal du script client embarqué dans le document HTML autonome.
 */
export function getStandaloneScript(
  styleConfig: StyleConfig,
  _entitiesGeoJSON?: any,
  _relationsGeoJSON?: any,
  _mode?: string,
  ardaDocJsonString: string = '{}'
): string {
  const mapInit = getStandaloneMapInitScript(styleConfig, ardaDocJsonString);
  const timelineLogic = getStandaloneTimelineScript();
  const slideLogic = getStandaloneSlideScript();

  return `
    ${mapInit}
    ${timelineLogic}
    ${slideLogic}
  `;
}

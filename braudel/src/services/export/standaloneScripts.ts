// services/export/standaloneScripts.ts

import { StyleConfig } from '../../core/styles.config';

export function getStandaloneScript(
  styleConfig: StyleConfig,
  entitiesGeoJSON: any,
  relationsGeoJSON: any,
  mode: string,
  storyJsonString: string
): string {
  return `
    const entitiesData = ${JSON.stringify(entitiesGeoJSON)};
    const relationsData = ${JSON.stringify(relationsGeoJSON)};
    const storyProject = ${storyJsonString};

    const map = new maplibregl.Map({
      container: 'map',
      style: '${styleConfig.mapStyleUrl}',
      center: [12.5, 42.0],
      zoom: 4,
      bearing: ${styleConfig.bearing || 0}
    });

    map.on('load', () => {
      map.addSource('entities', { type: 'geojson', data: entitiesData });
      map.addSource('relations', { type: 'geojson', data: relationsData });

      map.addLayer({
        id: 'relations-layer',
        type: 'line',
        source: 'relations',
        paint: {
          'line-color': '${styleConfig.id.includes('tolkien') ? '#D97706' : '#3B82F6'}',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      map.addLayer({
        id: 'entities-layer',
        type: 'circle',
        source: 'entities',
        paint: {
          'circle-radius': 6,
          'circle-color': '${styleConfig.id.includes('tolkien') ? '#10B981' : '#EF4444'}',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      if ('${mode}' === 'story' && storyProject && storyProject.scenes && storyProject.scenes.length > 0) {
        let currentSceneIdx = 0;

        function renderScene(idx) {
          const scene = storyProject.scenes[idx];
          if (!scene) return;

          document.getElementById('scene-title').innerText = scene.title || 'Scène sans titre';
          const sceneYear = scene.mapState?.timelineYear !== undefined ? scene.mapState.timelineYear : (scene.year !== undefined ? scene.year : '');
          document.getElementById('scene-year').innerText = sceneYear;
          document.getElementById('scene-text').innerText = scene.body || scene.narrationText || '';
          document.getElementById('scene-idx').innerText = (idx + 1) + ' / ' + storyProject.scenes.length;

          const mapState = scene.mapState || scene.camera;
          if (mapState && mapState.center) {
            map.flyTo({
              center: [mapState.center[0], mapState.center[1]],
              zoom: mapState.zoom !== undefined ? mapState.zoom : 4,
              pitch: mapState.pitch || 0,
              bearing: mapState.bearing || 0,
              duration: 2500
            });
          }

          document.getElementById('btn-prev').disabled = (idx === 0);
          document.getElementById('btn-next').disabled = (idx === storyProject.scenes.length - 1);
        }

        function prevScene() {
          if (currentSceneIdx > 0) {
            currentSceneIdx--;
            renderScene(currentSceneIdx);
          }
        }

        function nextScene() {
          if (currentSceneIdx < storyProject.scenes.length - 1) {
            currentSceneIdx++;
            renderScene(currentSceneIdx);
          }
        }

        document.getElementById('btn-prev').addEventListener('click', prevScene);
        document.getElementById('btn-next').addEventListener('click', nextScene);

        renderScene(0);
      }

      // Wiki routing and modal
      const wikiModal = document.getElementById('wiki-modal');
      const wikiCloseBtn = document.getElementById('wiki-close-btn');
      const wikiTitle = document.getElementById('wiki-title');
      const wikiBody = document.getElementById('wiki-body');

      function openWikiForEntity(entity) {
        if (!entity || !wikiModal) return;
        const name = entity.properties?.name || entity.name || 'Entité';
        const content = entity.properties?.wikiContent || entity.wikiContent || 'Aucune documentation disponible.';
        wikiTitle.innerText = name;
        wikiBody.innerText = content;
        wikiModal.classList.add('open');
        window.location.hash = '#/wiki/' + (entity.id || entity.properties?.id || '');
      }

      function closeWiki() {
        if (wikiModal) wikiModal.classList.remove('open');
        if (window.location.hash.startsWith('#/wiki/')) {
          window.location.hash = '';
        }
      }

      if (wikiCloseBtn) wikiCloseBtn.addEventListener('click', closeWiki);

      map.on('click', 'entities-layer', (e) => {
        if (e.features && e.features[0]) {
          openWikiForEntity(e.features[0]);
        }
      });

      function handleHashChange() {
        const hash = window.location.hash;
        if (hash.startsWith('#/wiki/')) {
          const targetId = hash.replace('#/wiki/', '');
          const found = entitiesData.features ? entitiesData.features.find(f => (f.id === targetId || f.properties?.id === targetId)) : null;
          if (found) {
            openWikiForEntity(found);
          }
        } else {
          if (wikiModal) wikiModal.classList.remove('open');
        }
      }

      window.addEventListener('hashchange', handleHashChange);
      handleHashChange();
    });
  `;
}

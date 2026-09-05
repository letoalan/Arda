/**
 * Génère le script client pour le moteur de timeline, les waypoints et le recalcul dynamique de la légende.
 */
export function getStandaloneTimelineScript(): string {
  return `
    function getEraColor(year) {
      if (year < 476) return '#3B82F6';      // Antiquité (Bleu royal)
      if (year < 1492) return '#10B981';     // Moyen Âge (Émeraude)
      if (year < 1789) return '#F59E0B';     // Époque Moderne (Ambre)
      return '#EC4899';                     // Époque Contemporaine (Rose/Magenta)
    }

    function resolveDocBearing(explicitBearing) {
      const isAlIdrisi = (doc.map && (doc.map.styleId === 'al_idrisi' || (typeof doc.map.styleId === 'string' && doc.map.styleId.indexOf('idrisi') !== -1) || (doc.map.styleUrl && doc.map.styleUrl.indexOf('idrisi') !== -1)));
      if (isAlIdrisi) {
        if (explicitBearing === undefined || explicitBearing === null || explicitBearing === 0) {
          return 180;
        }
        return explicitBearing;
      }
      return explicitBearing || 0;
    }

    function initTimeline() {
      const slider = document.getElementById('timeline-slider');
      const track = document.getElementById('timeline-track');
      const progressBar = document.getElementById('timeline-progress');
      const ticksBar = document.getElementById('timeline-ticks-bar');
      const btnToggleLabels = document.getElementById('btn-toggle-labels');
      const btnPrevEpoch = document.getElementById('btn-timeline-prev-epoch');
      const btnNextEpoch = document.getElementById('btn-timeline-next-epoch');
      if (!slider || !track) return;

      slider.min = doc.timeline.start;
      slider.max = doc.timeline.end;
      const initialYear = doc.waypoints?.[0]?.year ?? doc.timeline.start;
      slider.value = initialYear;

      document.getElementById('lbl-start-year').innerText = formatYear(doc.timeline.start);
      document.getElementById('lbl-end-year').innerText = formatYear(doc.timeline.end);
      const activeYearLbl = document.getElementById('lbl-active-year');
      if (activeYearLbl) activeYearLbl.innerText = formatYear(initialYear);

      updateProgressFill(initialYear);

      // Génération des marqueurs positionnés proportionnellement au temps réel
      track.querySelectorAll('.timeline-marker').forEach(m => m.remove());
      if (ticksBar) ticksBar.innerHTML = '';

      const span = doc.timeline.end - doc.timeline.start || 1;
      let lastPlacedTickPct = -100;
      const MIN_TICK_DISTANCE_PCT = 7.0; // Distance minimale en % pour éviter tout chevauchement horizontal de texte

      (doc.waypoints || []).forEach((wp, idx) => {
        const marker = document.createElement('button');
        marker.className = 'timeline-marker' + (wp.slideRefs && wp.slideRefs.length > 0 ? ' has-slide' : '');
        const pct = ((wp.year - doc.timeline.start) / span) * 100;
        const clampedPct = Math.max(1.0, Math.min(99.0, pct));
        marker.style.left = clampedPct + '%';

        // Calcul de la densité d'entités pour adapter la taille du point (8px à 14px)
        const activeEntitiesCount = (entitiesData.features || []).filter(f => isEntityTemporallyVisible(f.properties || {}, wp.year)).length;
        const markerSize = Math.min(14, Math.max(8, 8 + Math.round(activeEntitiesCount * 0.6)));
        const eraColor = getEraColor(wp.year);

        marker.style.setProperty('--marker-size', markerSize + 'px');
        marker.style.setProperty('--marker-color', eraColor);
        marker.title = (wp.label || formatYear(wp.year)) + ' (' + activeEntitiesCount + ' entités actives)';
        marker.id = 'marker-' + wp.id;
        marker.onclick = () => goToWaypoint(wp.id, true);
        track.appendChild(marker);

        // Étiquette textuelle sur 1 SEULE LIGNE avec filtre anti-collision intelligent
        // Les points clés (premier, dernier, ou espacement suffisant) sont affichés
        const isKeyPoint = (idx === 0 || idx === doc.waypoints.length - 1 || (clampedPct - lastPlacedTickPct >= MIN_TICK_DISTANCE_PCT));

        if (ticksBar && isKeyPoint) {
          const tick = document.createElement('span');
          tick.className = 'timeline-tick-label';
          tick.id = 'tick-' + wp.id;
          tick.style.left = clampedPct + '%';
          tick.innerText = formatYearShort(wp.year);
          tick.title = (wp.label || '') + ' — ' + activeEntitiesCount + ' entités';
          tick.onclick = () => goToWaypoint(wp.id, true);
          ticksBar.appendChild(tick);
          lastPlacedTickPct = clampedPct;
        }
      });

      // Gestionnaire d'expansion/contraction des étiquettes temporelles
      if (btnToggleLabels && ticksBar) {
        btnToggleLabels.onclick = () => {
          ticksBar.classList.toggle('expanded');
          const isExpanded = ticksBar.classList.contains('expanded');
          const lbl = document.getElementById('lbl-toggle-text');
          if (lbl) lbl.innerText = isExpanded ? 'Masquer' : 'Dates';
        };
      }

      // Boutons de saut direct d'époque en époque
      if (btnPrevEpoch) {
        btnPrevEpoch.onclick = () => {
          if (currentWaypointIdx > 0) goToWaypoint(doc.waypoints[currentWaypointIdx - 1].id);
        };
      }
      if (btnNextEpoch) {
        btnNextEpoch.onclick = () => {
          if (currentWaypointIdx < doc.waypoints.length - 1) goToWaypoint(doc.waypoints[currentWaypointIdx + 1].id);
        };
      }

      // Contrôles de lecture automatique spatio-temporelle (Play/Pause & Vitesse)
      let isPlaying = false;
      let playTimer = null;
      const btnPlay = document.getElementById('btn-timeline-play');
      const iconPlay = document.getElementById('icon-timeline-play');
      const speedSelect = document.getElementById('timeline-speed-select');

      function togglePlay() {
        isPlaying = !isPlaying;
        if (iconPlay) iconPlay.innerText = isPlaying ? '⏸' : '▶';
        if (isPlaying) {
          if (Number(slider.value) >= doc.timeline.end) {
            slider.value = doc.timeline.start;
          }
          const getSpeed = () => (speedSelect ? Math.max(1, Number(speedSelect.value)) : 5);
          const intervalMs = 80;
          playTimer = setInterval(() => {
            const speed = getSpeed();
            const step = Math.max(0.5, (speed * intervalMs) / 1000);
            let nextVal = Number(slider.value) + step;
            if (nextVal >= doc.timeline.end) {
              nextVal = doc.timeline.end;
              slider.value = nextVal;
              const y = Math.round(nextVal);
              updateTemporalFilter(y);
              if (activeYearLbl) activeYearLbl.innerText = formatYear(y);
              updateProgressFill(y);
              renderLegendContent(y);
              togglePlay();
              return;
            }
            slider.value = Math.round(nextVal);
            const y = Number(slider.value);
            updateTemporalFilter(y);
            const sceneYear = document.getElementById('scene-year');
            if (sceneYear) sceneYear.innerText = formatYear(y);
            if (activeYearLbl) activeYearLbl.innerText = formatYear(y);
            updateProgressFill(y);
            renderLegendContent(y);
          }, intervalMs);
        } else {
          if (playTimer) clearInterval(playTimer);
          playTimer = null;
        }
      }

      if (btnPlay) {
        btnPlay.onclick = togglePlay;
      }

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
          e.preventDefault();
          togglePlay();
        }
      });

      slider.oninput = (e) => {
        if (isPlaying) togglePlay();
        const y = Number(e.target.value);
        updateTemporalFilter(y);
        document.getElementById('scene-year').innerText = formatYear(y);
        if (activeYearLbl) activeYearLbl.innerText = formatYear(y);
        updateProgressFill(y);
        renderLegendContent(y);
      };
    }

    function updateProgressFill(year) {
      const progressBar = document.getElementById('timeline-progress');
      if (!progressBar) return;
      const span = doc.timeline.end - doc.timeline.start || 1;
      const pct = Math.max(0, Math.min(100, ((year - doc.timeline.start) / span) * 100));
      progressBar.style.width = pct + '%';
    }

    function formatYear(y) {
      return y >= 0 ? 'An ' + y : Math.abs(y) + ' av. J.-C.';
    }

    function formatYearShort(y) {
      return y >= 0 ? '' + y : Math.abs(y) + ' av.';
    }

    function isEntityTemporallyVisible(p, year) {
      const vf = p.validFrom !== undefined ? p.validFrom : -999999;
      const vt = p.validTo !== undefined ? p.validTo : 999999;
      if (vf === vt) return vf === year;
      return vf <= year && year < vt;
    }

    function updateTemporalFilter(year) {
      // 1. Filtrage semi-ouvert [validFrom, validTo[ sur les couches vectorielles MapLibre
      // Événement ponctuel (validFrom === validTo) -> match exact, sinon validFrom <= year < validTo
      const fromFilter = ['<=', ['to-number', ['get', 'validFrom'], -999999], year];
      const toFilter = [
        'case',
        ['==', ['to-number', ['get', 'validFrom'], -999999], ['to-number', ['get', 'validTo'], 999999]],
        ['==', ['to-number', ['get', 'validTo'], 999999], year],
        ['>', ['to-number', ['get', 'validTo'], 999999], year]
      ];

      const polyGeom = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
      const lineGeom = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
      const pointGeom = ['==', '$type', 'Point'];

      if (map.getLayer('braudel-polygons')) {
        map.setFilter('braudel-polygons', ['all', polyGeom, fromFilter, toFilter]);
      }
      if (map.getLayer('braudel-polygon-outline')) {
        map.setFilter('braudel-polygon-outline', ['all', polyGeom, fromFilter, toFilter]);
      }
      if (map.getLayer('braudel-polygons-stroke')) {
        map.setFilter('braudel-polygons-stroke', ['all', polyGeom, fromFilter, toFilter]);
      }
      if (map.getLayer('braudel-lines')) {
        map.setFilter('braudel-lines', ['all', lineGeom, fromFilter, toFilter]);
      }
      if (map.getLayer('braudel-points')) {
        map.setFilter('braudel-points', ['all', pointGeom, fromFilter, toFilter]);
      }
    }

    function renderLegendContent(year) {
      const legendBody = document.getElementById('legend-content');
      if (!legendBody) return;

      const feats = (entitiesData.features || []).filter(f => {
        const p = f.properties || {};
        return isEntityTemporallyVisible(p, year);
      });

      if (feats.length === 0) {
        legendBody.innerHTML = '<p style="font-size: 0.85rem; opacity: 0.7; font-style: italic;">Aucune entité active pour cette date.</p>';
        return;
      }

      const groups = {};
      feats.forEach(f => {
        const p = f.properties || {};
        const geomType = f.geometry?.type || 'Point';
        const color = p.color || p.fillColor || '#3B82F6';
        const typeLabel = geomType === 'Polygon' ? 'Territoire' : (geomType === 'LineString' ? 'Itinéraire' : 'Lieu');
        const key = typeLabel + '__' + color;

        if (!groups[key]) {
          groups[key] = {
            typeLabel,
            geomType,
            color,
            items: []
          };
        }
        groups[key].items.push(p.name || p.NAME || 'Sans nom');
      });

      let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';
      Object.values(groups).forEach(g => {
        const previewText = g.items.slice(0, 3).join(', ') + (g.items.length > 3 ? ' (+' + (g.items.length - 3) + ')' : '');
        let symbolHtml = '';
        if (g.geomType === 'Polygon') {
          symbolHtml = '<span style="display:inline-block; width:16px; height:12px; border-radius:2px; background:' + g.color + '; border:1px solid rgba(255,255,255,0.4); margin-right:8px;"></span>';
        } else if (g.geomType === 'LineString') {
          symbolHtml = '<span style="display:inline-block; width:18px; height:3px; background:' + g.color + '; margin-right:8px;"></span>';
        } else {
          symbolHtml = '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:' + g.color + '; border:2px solid white; margin-right:8px;"></span>';
        }

        html += '<div style="background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">' +
          '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">' +
            '<div style="display: flex; align-items: center; font-weight: 600; font-size: 0.85rem;">' + symbolHtml + g.typeLabel + '</div>' +
            '<span style="font-size: 0.75rem; opacity: 0.7; background: var(--border-color); padding: 2px 6px; border-radius: 10px;">' + g.items.length + '</span>' +
          '</div>' +
          '<div style="font-size: 0.8rem; opacity: 0.85; line-height: 1.4; padding-left: 24px;">' + previewText + '</div>' +
        '</div>';
      });
      html += '</div>';

      legendBody.innerHTML = html;
    }

    function toggleLegend() {
      const drawer = document.getElementById('legend-drawer');
      if (drawer) drawer.classList.toggle('hidden');
    }

    function closeLegend() {
      const drawer = document.getElementById('legend-drawer');
      if (drawer) drawer.classList.add('hidden');
    }

    function goToWaypoint(waypointId, animate = true) {
      const idx = doc.waypoints.findIndex(w => w.id === waypointId);
      if (idx === -1) return;

      currentWaypointIdx = idx;
      const wp = doc.waypoints[idx];

      document.getElementById('scene-title').innerText = wp.label || doc.title;
      document.getElementById('scene-year').innerText = formatYear(wp.year);
      document.getElementById('scene-text').innerText = wp.narrationText || '';
      document.getElementById('scene-idx').innerText = (idx + 1) + ' / ' + doc.waypoints.length;

      const slider = document.getElementById('timeline-slider');
      if (slider) slider.value = wp.year;
      const activeYearLbl = document.getElementById('lbl-active-year');
      if (activeYearLbl) activeYearLbl.innerText = formatYear(wp.year);
      updateProgressFill(wp.year);

      document.querySelectorAll('.timeline-marker').forEach(m => m.classList.remove('active'));
      const activeMarker = document.getElementById('marker-' + wp.id);
      if (activeMarker) activeMarker.classList.add('active');

      const btnSlide = document.getElementById('btn-open-slide');
      const btnEditSlide = document.getElementById('btn-edit-slide-bento');

      const ensureSlideForWaypoint = (targetWp) => {
        let slideId = targetWp.slideRefs && targetWp.slideRefs[0];
        if (!slideId) {
          slideId = 'slide-' + targetWp.id;
          targetWp.slideRefs = [slideId];
          if (!doc.slides) doc.slides = [];
          if (!doc.slides.find(s => s.id === slideId)) {
            doc.slides.push({
              id: slideId,
              title: targetWp.label || ('Étape ' + formatYear(targetWp.year)),
              attachedToWaypoint: targetWp.id,
              returnBehavior: 'same-waypoint',
              aspectRatio: '9:16',
              elements: [
                {
                  id: 'text-title-' + Date.now(),
                  type: 'text',
                  content: targetWp.label || targetWp.narrationText || 'Titre de la Diapositive',
                  x: 40,
                  y: 50,
                  w: 460,
                  h: 80,
                  fontSize: 26,
                  fontWeight: 'bold',
                  color: '#ffffff'
                },
                {
                  id: 'text-body-' + Date.now(),
                  type: 'text',
                  content: targetWp.narrationText || 'Présentation détaillée des événements historiques et géopolitiques...',
                  x: 40,
                  y: 150,
                  w: 460,
                  h: 220,
                  fontSize: 16,
                  color: '#cbd5e1'
                }
              ]
            });
          }
        }
        return slideId;
      };

      const renderMiniSlidePreview = (targetSlide) => {
        const previewBox = document.getElementById('bento-slide-preview-box');
        const miniCanvas = document.getElementById('bento-mini-slide-canvas');
        const miniGrid = document.getElementById('bento-mini-slide-grid');
        if (!previewBox || !miniCanvas) return;

        if (!targetSlide || !targetSlide.elements || targetSlide.elements.length === 0) {
          previewBox.style.display = 'none';
          return;
        }

        previewBox.style.display = 'block';
        previewBox.onclick = () => openSlide(targetSlide.id, wp.id);

        miniCanvas.querySelectorAll('.mini-slide-el-abs').forEach(e => e.remove());
        if (miniGrid) miniGrid.innerHTML = '';

        if (targetSlide.background) {
          miniCanvas.style.backgroundColor = targetSlide.background.type === 'color' ? targetSlide.background.value : '#1e293b';
        } else {
          miniCanvas.style.backgroundColor = '#1e293b';
        }

        const elements = targetSlide.elements || [];
        const hasAbs = elements.some(e => e.x !== undefined && e.y !== undefined);

        if (hasAbs) {
          if (miniGrid) miniGrid.style.display = 'none';
          // Échelle proportionnelle ~0.25 (canvas 960x540 -> preview ~360x140)
          const scale = 0.25;
          elements.forEach(elem => {
            const el = document.createElement('div');
            el.className = 'mini-slide-el-abs';
            el.style.position = 'absolute';
            el.style.left = ((elem.x ?? 0) * scale) + 'px';
            el.style.top = ((elem.y ?? 0) * scale) + 'px';
            el.style.width = ((elem.w ?? 100) * scale) + 'px';
            el.style.height = ((elem.h ?? 50) * scale) + 'px';
            el.style.borderRadius = (elem.shapeType === 'circle' ? '50%' : '3px');
            el.style.backgroundColor = elem.backgroundColor || (elem.type === 'shape' ? 'rgba(59, 130, 246, 0.4)' : 'transparent');
            el.style.border = elem.borderWidth ? (Math.max(1, Math.round(elem.borderWidth * scale)) + 'px solid ' + (elem.borderColor || '#3B82F6')) : 'none';
            el.style.overflow = 'hidden';
            el.style.color = elem.color || '#fff';
            el.style.fontSize = Math.max(7, Math.round((elem.fontSize || 14) * scale)) + 'px';
            el.style.lineHeight = '1.1';
            el.style.padding = '2px';

            if (elem.type === 'text' || !elem.type) {
              el.innerText = elem.content || elem.title || '';
            } else if (elem.type === 'image') {
              const img = document.createElement('img');
              img.src = elem.url || elem.src || '';
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              el.appendChild(img);
            } else if (elem.type === 'diagram') {
              el.innerText = '📊 ' + (elem.title || 'Schéma');
            } else if (elem.type === 'video') {
              el.innerText = '🎬 Vidéo';
            }
            miniCanvas.appendChild(el);
          });
        } else if (miniGrid) {
          miniGrid.style.display = 'grid';
          elements.slice(0, 3).forEach(elem => {
            const card = document.createElement('div');
            card.className = 'mini-slide-card';
            card.innerText = elem.title || elem.content || 'Élément';
            miniGrid.appendChild(card);
          });
        }
      };

      if (btnSlide) {
        btnSlide.onclick = () => {
          const sId = ensureSlideForWaypoint(wp);
          openSlide(sId, wp.id);
        };
      }

      if (btnEditSlide) {
        btnEditSlide.onclick = () => {
          const sId = ensureSlideForWaypoint(wp);
          openSlideEditor(sId);
        };
      }

      // Synchronisation de la miniature de slide active
      const currentSlideId = wp.slideRefs && wp.slideRefs[0];
      const targetSlide = currentSlideId ? doc.slides.find(s => s.id === currentSlideId) : null;
      renderMiniSlidePreview(targetSlide);

      // Mise à jour de la barre de progression globale du récit Bento
      const storyProgressBar = document.getElementById('bento-story-progress');
      if (storyProgressBar && doc.waypoints.length > 0) {
        const progressPct = ((idx + 1) / doc.waypoints.length) * 100;
        storyProgressBar.style.width = progressPct + '%';
      }

      // Préparation des tooltips de prévisualisation sur les boutons Précédent / Suivant
      const tooltipPrev = document.getElementById('tooltip-prev-title');
      const tooltipNext = document.getElementById('tooltip-next-title');
      if (tooltipPrev) {
        const prevWp = idx > 0 ? doc.waypoints[idx - 1] : null;
        tooltipPrev.innerText = prevWp ? (formatYear(prevWp.year) + ' : ' + (prevWp.label || 'Étape précédente')) : '';
      }
      if (tooltipNext) {
        const nextWp = idx < doc.waypoints.length - 1 ? doc.waypoints[idx + 1] : null;
        tooltipNext.innerText = nextWp ? (formatYear(nextWp.year) + ' : ' + (nextWp.label || 'Étape suivante')) : '';
      }

      // Mise à jour de l'état actif sur les étiquettes de la timeline
      document.querySelectorAll('.timeline-tick-label').forEach(t => t.classList.remove('active'));
      const activeTick = document.getElementById('tick-' + wp.id);
      if (activeTick) activeTick.classList.add('active');

      const cam = wp.cameraState || {};
      if (animate && cam.center) {
        map.flyTo({
          center: cam.center,
          zoom: cam.zoom ?? 4,
          pitch: cam.pitch || 0,
          bearing: resolveDocBearing(cam.bearing),
          duration: 2000
        });
      } else if (cam.center) {
        map.jumpTo({ center: cam.center, zoom: cam.zoom ?? 4, pitch: cam.pitch || 0, bearing: resolveDocBearing(cam.bearing) });
      }

      updateTemporalFilter(wp.year);
      renderLegendContent(wp.year);

      document.getElementById('btn-prev').disabled = (idx === 0);
      document.getElementById('btn-next').disabled = (idx === doc.waypoints.length - 1);

      history.replaceState(null, '', '#/timeline/' + wp.year);
    }

    /* ==========================================================================
       LOGIQUE D'EXÉCUTION DU MODE EX (Sidecar Scrollytelling, Map Actions, Minimap)
       ========================================================================== */

    let isSidecarMode = false;
    let isSidecarVertical = false;
    let sidecarObserver = null;
    let contextMinimapInstance = null;

    function initModeExSidecar() {
      const btnToggleSidecar = document.getElementById('btn-toggle-sidecar');
      const btnToggleOrientation = document.getElementById('btn-toggle-orientation');
      const sidecarPanel = document.getElementById('sidecar-narrative-panel');
      const scrollContent = document.getElementById('sidecar-scroll-content');
      const btnTimelineOverview = document.getElementById('btn-sidecar-timeline-overview');
      const minimapBox = document.getElementById('context-minimap-box');

      // 1. Rendu initial des cartes d'argumentation scrollytelling
      if (scrollContent && doc.waypoints) {
        scrollContent.innerHTML = '';
        doc.waypoints.forEach((wp, idx) => {
          const card = document.createElement('article');
          card.className = 'narrative-step-card' + (idx === 0 ? ' active-step' : '');
          card.id = 'sidecar-step-' + wp.id;
          card.setAttribute('data-step-index', String(idx));
          card.setAttribute('data-waypoint-id', wp.id);

          const partBadge = wp.partOfArgument ? ('<span class="narrative-part-badge">' + wp.partOfArgument + '</span>') : '';
          const yearBadge = '<span class="badge-era">' + formatYear(wp.year) + '</span>';

          // Analyse et transformation des actions de texte cliquables (Phase 4)
          let narrationHtml = wp.narrationText || '';
          if (wp.actions && wp.actions.length > 0) {
            wp.actions.forEach((act) => {
              if (act.triggerText && narrationHtml.includes(act.triggerText)) {
                const actionData = encodeURIComponent(JSON.stringify(act));
                const replacement = '<span class="map-action-trigger" data-action="' + actionData + '">' + act.triggerText + ' 🔍</span>';
                narrationHtml = narrationHtml.split(act.triggerText).join(replacement);
              }
            });
          }

          // Détection automatique de taille pour règle de sécurité anti-débordement
          const isLongText = (wp.narrationText || '').length > 500;

          card.innerHTML = 
            '<div class="narrative-card-header">' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                partBadge +
                yearBadge +
              '</div>' +
              '<span class="sidecar-progress-count">' + (idx + 1) + ' / ' + doc.waypoints.length + '</span>' +
            '</div>' +
            '<h2 class="narrative-step-title">' + (wp.label || ('Étape ' + (idx + 1))) + '</h2>' +
            '<div class="narrative-step-body">' + narrationHtml + '</div>' +
            '<div class="narrative-step-footer">' +
              '<div style="display:flex; gap:6px; align-items:center;">' +
                '<button class="btn-slide-trigger btn-slide-primary btn-sidecar-open-slide" style="font-size:0.75rem; padding:4px 8px;" data-step-idx="' + idx + '">' +
                  '★ ' + (wp.slideRefs && wp.slideRefs.length > 0 ? 'Voir Diapositive' : 'Diapositive') +
                '</button>' +
                '<button class="tool-btn btn-sidecar-edit-slide" style="font-size:0.72rem; padding:4px 6px;" data-step-idx="' + idx + '" title="Éditer la diapositive de cette étape">' +
                  '✏️' +
                '</button>' +
              '</div>' +
              '<button class="tool-btn btn-sidecar-recenter" style="font-size:0.72rem; padding:4px 6px;" data-step-idx="' + idx + '">🎯 Recadrer</button>' +
            '</div>';

          // Clic direct sur le bouton de diapositive
          const btnSlideEl = card.querySelector('.btn-sidecar-open-slide');
          if (btnSlideEl) {
            btnSlideEl.addEventListener('click', (e) => {
              e.stopPropagation();
              const sId = (wp.slideRefs && wp.slideRefs[0]) ? wp.slideRefs[0] : ('slide-' + wp.id);
              if (!wp.slideRefs || wp.slideRefs.length === 0) {
                wp.slideRefs = [sId];
                if (!doc.slides) doc.slides = [];
                if (!doc.slides.find(s => s.id === sId)) {
                  doc.slides.push({
                    id: sId,
                    title: wp.label || ('Étape ' + formatYear(wp.year)),
                    attachedToWaypoint: wp.id,
                    returnBehavior: 'same-waypoint',
                    elements: [
                      {
                        id: 'text-title-' + Date.now(),
                        type: 'text',
                        content: wp.label || wp.narrationText || 'Titre de la Diapositive',
                        x: 40,
                        y: 50,
                        w: 460,
                        h: 80,
                        fontSize: 26,
                        fontWeight: 'bold',
                        color: '#ffffff'
                      },
                      {
                        id: 'text-body-' + Date.now(),
                        type: 'text',
                        content: wp.narrationText || 'Présentation détaillée des événements historiques et géopolitiques...',
                        x: 40,
                        y: 150,
                        w: 460,
                        h: 220,
                        fontSize: 16,
                        color: '#cbd5e1'
                      }
                    ]
                  });
                }
              }
              openSlide(sId, wp.id);
            });
          }

          // Clic direct sur le bouton d'édition de diapositive
          const btnEditEl = card.querySelector('.btn-sidecar-edit-slide');
          if (btnEditEl) {
            btnEditEl.addEventListener('click', (e) => {
              e.stopPropagation();
              const sId = (wp.slideRefs && wp.slideRefs[0]) ? wp.slideRefs[0] : ('slide-' + wp.id);
              if (!wp.slideRefs || wp.slideRefs.length === 0) {
                wp.slideRefs = [sId];
                if (!doc.slides) doc.slides = [];
                if (!doc.slides.find(s => s.id === sId)) {
                  doc.slides.push({
                    id: sId,
                    title: wp.label || ('Étape ' + formatYear(wp.year)),
                    attachedToWaypoint: wp.id,
                    returnBehavior: 'same-waypoint',
                    elements: [
                      {
                        id: 'text-title-' + Date.now(),
                        type: 'text',
                        content: wp.label || wp.narrationText || 'Titre de la Diapositive',
                        x: 40,
                        y: 50,
                        w: 460,
                        h: 80,
                        fontSize: 26,
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }
                    ]
                  });
                }
              }
              openSlideEditor(sId);
            });
          }

          // Clic direct sur le bouton de recadrage
          const btnRecenterEl = card.querySelector('.btn-sidecar-recenter');
          if (btnRecenterEl) {
            btnRecenterEl.addEventListener('click', (e) => {
              e.stopPropagation();
              recenterStepByIndex(idx);
            });
          }

          // Clic direct sur la carte pour sauter à l'étape
          card.onclick = (e) => {
            if (e.target.closest('.map-action-trigger') || e.target.closest('button')) return;
            goToWaypoint(wp.id, true);
          };

          if (isLongText) {
            card.classList.add('has-long-text');
          }

          scrollContent.appendChild(card);
        });

        // Liaison des écouteurs Map Action interactifs
        scrollContent.querySelectorAll('.map-action-trigger').forEach((el) => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
              const actionData = JSON.parse(decodeURIComponent(el.getAttribute('data-action') || '{}'));
              triggerMapAction(actionData, el);
            } catch (err) {
              console.warn('Erreur déclenchement Map Action:', err);
            }
          });
        });
      }

      // 2. Initialisation de l'IntersectionObserver pour le Scrollytelling
      if (scrollContent) {
        if (sidecarObserver) sidecarObserver.disconnect();
        sidecarObserver = new IntersectionObserver((entries) => {
          if (!isSidecarMode) return;
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const idx = parseInt(entry.target.getAttribute('data-step-index') || '0', 10);
              const wp = doc.waypoints[idx];
              if (wp && currentWaypointIdx !== idx) {
                currentWaypointIdx = idx;
                // Transition de caméra scrollytelling fluide (600-900ms)
                const cam = wp.cameraState || {};
                if (cam.center) {
                  map.flyTo({
                    center: cam.center,
                    zoom: cam.zoom ?? 4,
                    pitch: cam.pitch || 0,
                    bearing: resolveDocBearing(cam.bearing),
                    duration: 800,
                    essential: true
                  });
                }
                updateTemporalFilter(wp.year);
                renderLegendContent(wp.year);
                updateVerticalTimelineProgress(idx, doc.waypoints.length);

                // Mise à jour de l'état actif visuel
                document.querySelectorAll('.narrative-step-card').forEach(c => c.classList.remove('active-step'));
                entry.target.classList.add('active-step');

                // Règle automatique d'agrandissement anti-débordement
                if (sidecarPanel) {
                  if (entry.target.classList.contains('has-long-text')) {
                    sidecarPanel.classList.add('narrative-expanded');
                  } else {
                    sidecarPanel.classList.remove('narrative-expanded');
                  }
                }
              }
            }
          });
        }, {
          root: scrollContent,
          threshold: [0.5]
        });

        scrollContent.querySelectorAll('.narrative-step-card').forEach((card) => {
          sidecarObserver.observe(card);
        });

        scrollContent.addEventListener('scroll', () => {
          if (!isSidecarMode) return;
          const maxScroll = scrollContent.scrollHeight - scrollContent.clientHeight;
          const currentScroll = scrollContent.scrollTop;
          const pct = maxScroll > 0 ? (currentScroll / maxScroll) * 100 : 0;
          const bar = document.getElementById('sidecar-vertical-progress-bar');
          if (bar) {
            if (isSidecarVertical) {
              bar.style.width = pct + '%';
              bar.style.height = '100%';
            } else {
              bar.style.height = pct + '%';
              bar.style.width = '100%';
            }
          }
        });
      }

      // 3. Bascule du Mode Sidecar Docked
      if (btnToggleSidecar) {
        btnToggleSidecar.onclick = toggleSidecarMode;
      }
      if (btnToggleOrientation) {
        btnToggleOrientation.onclick = toggleSidecarOrientation;
      }
      if (btnTimelineOverview) {
        btnTimelineOverview.onclick = () => {
          const tb = document.getElementById('bento-timeline-bar');
          if (tb) {
            tb.style.display = tb.style.display === 'none' ? 'flex' : 'none';
          }
        };
      }

      // 4. Initialisation de la Mini-Carte de Contexte Macro (Phase 5)
      initContextMinimap();
    }

    function toggleSidecarMode() {
      isSidecarMode = !isSidecarMode;
      document.body.classList.toggle('mode-ex-active', isSidecarMode);
      const icon = document.getElementById('icon-sidecar');
      if (icon) icon.innerText = isSidecarMode ? '🗂️' : '📑';

      const timelineBar = document.getElementById('bento-timeline-bar');
      if (timelineBar) {
        // En mode EX, la timeline horizontale est masquée par défaut au profit du scroll
        timelineBar.style.display = isSidecarMode ? 'none' : 'flex';
      }

      setTimeout(() => {
        if (map) map.resize();
        if (contextMinimapInstance) contextMinimapInstance.resize();
      }, 300);
    }

    function toggleSidecarOrientation() {
      isSidecarVertical = !isSidecarVertical;
      document.body.classList.toggle('mode-ex-vertical', isSidecarVertical);
      const icon = document.getElementById('icon-orientation');
      if (icon) icon.innerText = isSidecarVertical ? '⇵' : '⇄';
      setTimeout(() => {
        if (map) map.resize();
      }, 300);
    }

    function recenterStepByIndex(idx) {
      if (doc.waypoints && doc.waypoints[idx]) {
        goToWaypoint(doc.waypoints[idx].id, true);
        const card = document.getElementById('sidecar-step-' + doc.waypoints[idx].id);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function updateVerticalTimelineProgress(currentIdx, totalCount) {
      const counter = document.getElementById('sidecar-progress-count');
      if (counter) counter.innerText = (currentIdx + 1) + ' / ' + totalCount;
    }

    function triggerMapAction(action, triggerElement) {
      if (!action) return;

      // 1. Déplacement de caméra temporaire vers l'entité / viewpoint
      if (action.viewpoint && action.viewpoint.center) {
        map.flyTo({
          center: action.viewpoint.center,
          zoom: action.viewpoint.zoom ?? (map.getZoom() + 1.5),
          pitch: action.viewpoint.pitch || 0,
          bearing: resolveDocBearing(action.viewpoint.bearing),
          duration: 650
        });
      }

      // 2. Affichage d'un popover d'information inline avec bouton de retour
      document.querySelectorAll('.map-action-popover').forEach(p => p.remove());

      const popover = document.createElement('div');
      popover.className = 'map-action-popover';

      const popTitle = action.popupInfo?.title || action.triggerText || 'Détail exploratoire';
      const popDates = action.popupInfo?.dates ? ('<span style="opacity:0.7; font-size:0.7rem;">' + action.popupInfo.dates + '</span>') : '';
      const popDesc = action.popupInfo?.description || 'Focus contextuel sans interruption du fil narratif.';

      popover.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<strong>' + popTitle + '</strong>' +
          popDates +
        '</div>' +
        '<p style="margin:0; opacity:0.9; line-height:1.4;">' + popDesc + '</p>' +
        '<button class="btn-return-thread" id="btn-return-action-thread">← Retour au fil</button>';

      document.body.appendChild(popover);

      // Positionnement au-dessus ou à côté du mot-clé
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        popover.style.left = Math.min(window.innerWidth - 300, Math.max(10, rect.left)) + 'px';
        popover.style.top = Math.max(10, rect.bottom + 8) + 'px';
      }

      document.getElementById('btn-return-action-thread')?.addEventListener('click', () => {
        popover.remove();
        // Retour immédiat au point de vue de l'étape active
        if (doc.waypoints && doc.waypoints[currentWaypointIdx]) {
          const wp = doc.waypoints[currentWaypointIdx];
          if (wp.cameraState?.center) {
            map.flyTo({
              center: wp.cameraState.center,
              zoom: wp.cameraState.zoom ?? 4,
              pitch: wp.cameraState.pitch || 0,
              bearing: resolveDocBearing(wp.cameraState.bearing),
              duration: 500
            });
          }
        }
      });
    }

    function initContextMinimap() {
      const box = document.getElementById('context-minimap-box');
      if (!box || !window.maplibregl) return;

      try {
        let isContinental = false;
        const defaultMacroZoom = 0.9;
        const continentalZoom = 3.2;
        const macroCenter = doc.map?.center || [12.5, 42.0];

        contextMinimapInstance = new maplibregl.Map({
          container: 'context-minimap-canvas',
          style: doc.map?.styleUrl || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: macroCenter,
          zoom: defaultMacroZoom,
          interactive: false,
          attributionControl: false
        });

        function updateIndicator() {
          if (!contextMinimapInstance) return;
          const center = map.getCenter();
          const indicator = document.getElementById('context-minimap-indicator');
          if (!indicator) return;

          if (isContinental) {
            // En vue continentale, la minicarte est centrée sur le point de vue actif :
            // le marqueur est donc situé au centre du canevas
            const w = box.clientWidth || 220;
            const h = box.clientHeight || 220;
            indicator.style.left = (w / 2) + 'px';
            indicator.style.top = (h / 2) + 'px';
          } else {
            // En vue macro générale, l'indicateur se projette sur le globe selon sa position réelle
            const pt = contextMinimapInstance.project(center);
            const w = box.clientWidth || 145;
            const h = box.clientHeight || 145;
            indicator.style.left = Math.max(8, Math.min(w - 8, pt.x)) + 'px';
            indicator.style.top = Math.max(8, Math.min(h - 8, pt.y)) + 'px';
          }
        }

        function applyScale(animate) {
          if (!contextMinimapInstance) return;
          const badge = document.getElementById('context-minimap-scale');
          if (badge) {
            badge.innerText = isContinental ? 'Continentale' : 'Macro';
          }

          if (isContinental) {
            const currentCenter = map.getCenter();
            if (animate) {
              contextMinimapInstance.easeTo({
                center: currentCenter,
                zoom: continentalZoom,
                duration: 350
              });
            } else {
              contextMinimapInstance.setCenter(currentCenter);
              contextMinimapInstance.setZoom(continentalZoom);
            }
          } else {
            if (animate) {
              contextMinimapInstance.easeTo({
                center: macroCenter,
                zoom: defaultMacroZoom,
                duration: 350
              });
            } else {
              contextMinimapInstance.setCenter(macroCenter);
              contextMinimapInstance.setZoom(defaultMacroZoom);
            }
          }
          updateIndicator();
        }

        box.onclick = () => {
          isContinental = !isContinental;
          box.classList.toggle('is-continental-view', isContinental);
          box.classList.toggle('is-macro-expanded', isContinental);
          
          applyScale(true);

          setTimeout(() => {
            if (contextMinimapInstance) {
              contextMinimapInstance.resize();
              updateIndicator();
            }
          }, 220);
        };

        // Synchronisation du point indicateur et du centrage continental sur déplacement de la carte principale
        map.on('move', () => {
          if (!contextMinimapInstance) return;
          if (isContinental) {
            contextMinimapInstance.setCenter(map.getCenter());
          }
          updateIndicator();
        });

        // Suivi continu du marqueur pendant les animations de la minicarte
        contextMinimapInstance.on('move', updateIndicator);
        contextMinimapInstance.on('load', updateIndicator);

      } catch (err) {
        console.warn('Initialisation context minimap:', err);
      }
    }
  `;
}

/**
 * Génère le script client pour les diapositives, le mode présentation, la sauvegarde, les raccourcis et le wiki.
 */
export function getStandaloneSlideScript(): string {
  return `
    function parseDiagramFlowHTML(rawText) {
      if (!rawText) return '';
      const text = String(rawText).trim();
      // Découper par '->' ou par saut de ligne
      let steps = [];
      if (text.includes('->') || text.includes('➔') || text.includes('→')) {
        steps = text.split(/->|➔|→/).map(s => s.trim()).filter(Boolean);
      } else if (text.includes(String.fromCharCode(10))) {
        steps = text.split(String.fromCharCode(10)).map(s => s.trim()).filter(Boolean);
      } else {
        steps = [text];
      }

      let html = '<div class="diagram-flow-nodes">';
      steps.forEach((step, idx) => {
        html += '<div class="diagram-flow-node">' + step + '</div>';
        if (idx < steps.length - 1) {
          html += '<div class="diagram-flow-arrow">➔</div>';
        }
      });
      html += '</div>';
      return html;
    }

    function openSlide(slideId, fromWaypointId) {
      const slide = doc.slides.find(s => s.id === slideId);
      if (!slide) return;

      currentContext = { returningTo: fromWaypointId, activeSlideId: slideId };

      const slideContainer = document.getElementById('slide-container');
      if (slideContainer) {
        slideContainer.classList.remove('hidden');
        renderSlideContent(slide);
      }

      history.replaceState(null, '', '#/slide/' + slideId);
    }

    function closeSlideAndReturn() {
      const slideContainer = document.getElementById('slide-container');
      if (slideContainer) {
        slideContainer.classList.add('hidden');
        slideContainer.classList.remove('slide-split-active');
      }
      document.body.classList.remove('slide-split-mode-active');
      if (map) map.resize();

      // Retour exact garanti au waypoint d'origine sans rechargement lourd
      if (currentContext && currentContext.returningTo) {
        goToWaypoint(currentContext.returningTo, true);
      }
    }

    function renderSlideContent(slide) {
      document.getElementById('slide-title').innerText = slide.title || "Diapositive d'appui";
      const grid = document.getElementById('slide-grid');
      const canvas = document.getElementById('slide-canvas');
      const mainStage = document.getElementById('slide-main-stage');
      if (!grid) return;

      const isPortrait = (slide.aspectRatio === '9:16') || (!slide.aspectRatio && isSidecarMode);
      const targetW = isPortrait ? 540 : 960;
      const targetH = isPortrait ? 960 : 540;

      grid.innerHTML = '';
      if (canvas) {
        canvas.querySelectorAll('.slide-element-absolute').forEach(el => el.remove());
        if (slide.background) {
          if (slide.background.type === 'color') {
            canvas.style.backgroundColor = slide.background.value;
            canvas.style.backgroundImage = 'none';
          } else if (slide.background.type === 'image') {
            canvas.style.backgroundImage = 'url(' + slide.background.value + ')';
            canvas.style.backgroundSize = 'cover';
          }
        } else {
          canvas.style.backgroundColor = '';
          canvas.style.backgroundImage = '';
        }

        // Grille d'origine fixe 1-to-1 avec l'éditeur
        canvas.style.width = targetW + 'px';
        canvas.style.height = targetH + 'px';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        // Application du facteur d'échelle homothétique exact (0 bande latérale parasite)
        if (mainStage) {
          const viewportFrame = mainStage.parentElement;
          const updateScale = () => {
            const parentRect = viewportFrame ? viewportFrame.getBoundingClientRect() : mainStage.parentElement?.getBoundingClientRect();
            if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
              if (isSidecarMode) {
                // Rendu Plein Bord Edge-to-Edge sous le header
                mainStage.style.width = '100%';
                mainStage.style.height = '100%';
                const scale = Math.min(parentRect.width / targetW, parentRect.height / targetH);
                canvas.style.transform = 'scale(' + scale + ')';
                canvas.style.transformOrigin = 'center center';
                canvas.style.position = 'relative';
                canvas.style.top = 'auto';
                canvas.style.left = 'auto';
              } else {
                const maxW = parentRect.width - 24;
                const maxH = Math.max(300, parentRect.height - 24);
                const scale = Math.min(1, Math.min(maxW / targetW, maxH / targetH));
                
                mainStage.style.width = Math.round(targetW * scale) + 'px';
                mainStage.style.height = Math.round(targetH * scale) + 'px';

                canvas.style.transform = 'scale(' + scale + ')';
                canvas.style.transformOrigin = 'top left';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
              }
            }
          };
          updateScale();
          setTimeout(updateScale, 30);
          if (window.ResizeObserver && viewportFrame && !viewportFrame._scaleObserved) {
            viewportFrame._scaleObserved = true;
            new ResizeObserver(updateScale).observe(viewportFrame);
          }
        }
      }

      const elements = slide.elements || [];
      const hasAbsoluteLayout = elements.some(e => e.x !== undefined && e.y !== undefined);

      if (hasAbsoluteLayout && canvas) {
        grid.style.display = 'none';
        elements.forEach(elem => {
          const el = document.createElement('div');
          el.className = 'slide-element-absolute';
          el.style.left = (elem.x ?? 0) + 'px';
          el.style.top = (elem.y ?? 0) + 'px';
          if (elem.w) el.style.width = elem.w + 'px';
          if (elem.h) el.style.height = elem.h + 'px';
          if (elem.backgroundColor) el.style.backgroundColor = elem.backgroundColor;
          if (elem.color) el.style.color = elem.color;
          if (elem.fontSize) el.style.fontSize = elem.fontSize + 'px';
          if (elem.fontWeight) el.style.fontWeight = elem.fontWeight;
          if (elem.align) el.style.textAlign = elem.align;
          if (elem.shapeType === 'circle') el.style.borderRadius = '50%';
          if (elem.shapeType === 'pill') el.style.borderRadius = '9999px';
          if (elem.rotation) el.style.transform = 'rotate(' + elem.rotation + 'deg)';
          if (elem.opacity !== undefined) el.style.opacity = elem.opacity;
          if (elem.zIndex) el.style.zIndex = elem.zIndex;
          if (elem.borderColor) el.style.borderColor = elem.borderColor;
          if (elem.borderWidth) el.style.borderWidth = elem.borderWidth + 'px';
          if (elem.borderRadius) el.style.borderRadius = elem.borderRadius + 'px';

          if (elem.type === 'video' && (elem.videoUrl || elem.url || elem.src)) {
            const vUrl = elem.videoUrl || elem.url || elem.src;
            if (vUrl.includes('youtube.com') || vUrl.includes('youtu.be') || vUrl.includes('vimeo.com')) {
              const iframe = document.createElement('iframe');
              let embedUrl = vUrl;
              if (vUrl.includes('youtube.com/watch?v=')) {
                embedUrl = vUrl.replace('watch?v=', 'embed/');
              } else if (vUrl.includes('youtu.be/')) {
                embedUrl = vUrl.replace('youtu.be/', 'www.youtube.com/embed/');
              }
              iframe.src = embedUrl;
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              iframe.allowFullscreen = true;
              el.appendChild(iframe);
            } else {
              const video = document.createElement('video');
              video.src = vUrl;
              video.controls = true;
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.objectFit = 'cover';
              video.style.borderRadius = 'inherit';
              el.appendChild(video);
            }
          } else if (elem.type === 'diagram') {
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.style.background = elem.backgroundColor || 'rgba(30, 41, 59, 0.85)';
            el.style.border = '1px solid ' + (elem.borderColor || 'var(--border-color)');
            el.style.borderRadius = (elem.borderRadius || 8) + 'px';
            el.style.padding = '12px';
            
            if (elem.title) {
              const titleSpan = document.createElement('strong');
              titleSpan.innerText = '📊 ' + elem.title;
              titleSpan.style.fontSize = '0.9rem';
              titleSpan.style.marginBottom = '8px';
              el.appendChild(titleSpan);
            }

            const diagBody = document.createElement('div');
            diagBody.className = 'diagram-flow-container';
            diagBody.innerHTML = parseDiagramFlowHTML(elem.content || '1. Étape A -> 2. Étape B -> 3. Étape C');
            el.appendChild(diagBody);
          } else if (elem.type === 'image' && (elem.url || elem.src)) {
            const img = document.createElement('img');
            img.src = elem.url || elem.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = elem.objectFit || 'contain';
            img.style.borderRadius = 'inherit';
            el.appendChild(img);
          } else if (elem.type === 'text' || !elem.type) {
            el.innerText = elem.content || elem.text || elem.title || '';
            el.style.padding = '8px 12px';
          } else if (elem.type === 'shape') {
            el.style.border = (elem.borderWidth || 2) + 'px solid ' + (elem.borderColor || elem.color || 'var(--accent-color)');
          }
          canvas.appendChild(el);
        });
      } else {
        grid.style.display = 'grid';
        elements.forEach(elem => {
          const card = document.createElement('div');
          card.className = 'slide-card';
          if (elem.title) {
            const h = document.createElement('h3');
            h.innerText = elem.title;
            h.style.marginTop = '0';
            card.appendChild(h);
          }
          if (elem.type === 'image' && (elem.url || elem.src)) {
            const img = document.createElement('img');
            img.src = elem.url || elem.src;
            card.appendChild(img);
          }
          if (elem.content || elem.text) {
            const p = document.createElement('p');
            p.innerText = elem.content || elem.text;
            p.style.lineHeight = '1.6';
            card.appendChild(p);
          }
          grid.appendChild(card);
        });
      }

      const notes = document.getElementById('slide-speaker-notes');
      if (notes) {
        if (slide.speakerNotes) {
          notes.style.display = 'block';
          notes.innerText = 'Notes du présentateur : ' + slide.speakerNotes;
        } else {
          notes.style.display = 'none';
        }
      }
    }

    function togglePresentMode() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        document.body.classList.add('present-mode');
      } else {
        document.exitFullscreen().catch(() => {});
        document.body.classList.remove('present-mode');
      }
    }

    function initKeyboard() {
      window.addEventListener('keydown', (e) => {
        // Ignorer les raccourcis si l'utilisateur est en train de saisir dans un champ de formulaire
        const target = e.target;
        const isInputField = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        );
        if (isInputField) return;

        const slideModal = document.getElementById('slide-editor-modal');
        const isEditorOpen = slideModal && !slideModal.classList.contains('hidden');
        if (isEditorOpen) return;

        const slideContainer = document.getElementById('slide-container');
        const slideOpen = slideContainer && !slideContainer.classList.contains('hidden');
        if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
          if (slideOpen) {
            closeSlideAndReturn();
            return;
          }
          closeWiki();
          closeLegend();
        } else if (e.key === 'l' || e.key === 'L') {
          toggleLegend();
        } else if (e.key === 'c' || e.key === 'C') {
          recenterCurrentStep();
        } else if (e.key === 'd' || e.key === 'D') {
          toggleTheme();
        } else if (e.key === 'o' || e.key === 'O') {
          toggleSidecarOrientation();
        } else if (e.key === 'x' || e.key === 'X') {
          toggleSidecarMode();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
          if (currentWaypointIdx < doc.waypoints.length - 1) {
            goToWaypoint(doc.waypoints[currentWaypointIdx + 1].id);
          }
        } else if (e.key === 'ArrowLeft') {
          if (currentWaypointIdx > 0) {
            goToWaypoint(doc.waypoints[currentWaypointIdx - 1].id);
          }
        } else if (e.key === 's' || e.key === 'S') {
          if (slideOpen) {
            e.preventDefault();
            toggleSplitMode();
          }
        } else if (e.key === 'F5' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          togglePresentMode();
        } else if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          saveDeck();
        }
      });

      function recenterCurrentStep() {
        if (typeof currentWaypointIdx === 'number' && doc.waypoints && doc.waypoints[currentWaypointIdx]) {
          goToWaypoint(doc.waypoints[currentWaypointIdx].id, true);
        }
      }

      let slideSplitState = 'full'; // 'full' | 'split' | 'pip'
      let pipMapInstance = null;

      function toggleSplitMode() {
        const slideContainer = document.getElementById('slide-container');
        const frame = document.getElementById('slide-viewport-frame');
        const pipPanel = document.getElementById('slide-pip-minimap');
        const icon = document.getElementById('icon-split-mode');

        if (slideSplitState === 'full') {
          slideSplitState = 'split';
          if (slideContainer) slideContainer.classList.add('slide-split-active');
          document.body.classList.add('slide-split-mode-active');
          if (frame) frame.classList.add('slide-split-mode');
          if (pipPanel) pipPanel.classList.add('hidden');
          if (icon) icon.innerText = '◫';
          if (map) map.resize();
        } else if (slideSplitState === 'split') {
          slideSplitState = 'pip';
          if (slideContainer) slideContainer.classList.remove('slide-split-active');
          document.body.classList.remove('slide-split-mode-active');
          if (frame) frame.classList.remove('slide-split-mode');
          if (pipPanel) pipPanel.classList.remove('hidden');
          if (icon) icon.innerText = '🔲';
          initPipMap();
          if (map) map.resize();
        } else {
          slideSplitState = 'full';
          if (slideContainer) slideContainer.classList.remove('slide-split-active');
          document.body.classList.remove('slide-split-mode-active');
          if (frame) frame.classList.remove('slide-split-mode');
          if (pipPanel) pipPanel.classList.add('hidden');
          if (icon) icon.innerText = '⬓';
          if (map) map.resize();
        }
      }

      function initPipMap() {
        const container = document.getElementById('slide-pip-map-canvas');
        if (!container) return;

        const wp = (typeof currentWaypointIdx === 'number' && doc.waypoints && doc.waypoints[currentWaypointIdx]) 
          ? doc.waypoints[currentWaypointIdx] 
          : null;
        const center = (wp && wp.cameraState) ? wp.cameraState.center : (doc.map.center || [12.5, 42.0]);
        const zoom = (wp && wp.cameraState) ? Math.max(1, (wp.cameraState.zoom ?? 4) - 1.5) : 2.5;
        const bearing = (wp && wp.cameraState) ? (wp.cameraState.bearing || 0) : 0;
        const pitch = (wp && wp.cameraState) ? (wp.cameraState.pitch || 0) : 0;
        const currentYear = wp ? wp.year : (doc.timeline.start || 0);

        if (pipMapInstance) {
          try {
            pipMapInstance.jumpTo({ center, zoom, bearing, pitch });
            updatePipTemporalFilter(currentYear);
          } catch (_) {}
          return;
        }

        try {
          const mapStyle = doc.map.styleUrl || (map ? map.getStyle() : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
          pipMapInstance = new maplibregl.Map({
            container: 'slide-pip-map-canvas',
            style: mapStyle,
            center: center,
            zoom: zoom,
            bearing: bearing,
            pitch: pitch,
            interactive: false,
            attributionControl: false
          });

          pipMapInstance.on('load', () => {
            try {
              pipMapInstance.addSource('pip-braudel-entities', {
                type: 'geojson',
                data: entitiesData
              });

              pipMapInstance.addLayer({
                id: 'pip-braudel-polygons',
                type: 'fill',
                source: 'pip-braudel-entities',
                filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
                paint: {
                  'fill-color': ['coalesce', ['get', 'fillColor'], ['get', 'color'], '#3B82F6'],
                  'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.45]
                }
              });

              pipMapInstance.addLayer({
                id: 'pip-braudel-polygon-outline',
                type: 'line',
                source: 'pip-braudel-entities',
                filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
                paint: {
                  'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#1D4ED8'],
                  'line-width': ['coalesce', ['get', 'lineWidth'], 1.2],
                  'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.85]
                }
              });

              pipMapInstance.addLayer({
                id: 'pip-braudel-lines',
                type: 'line',
                source: 'pip-braudel-entities',
                filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
                paint: {
                  'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
                  'line-width': 1.8
                }
              });

              pipMapInstance.addLayer({
                id: 'pip-braudel-points',
                type: 'circle',
                source: 'pip-braudel-entities',
                filter: ['==', '$type', 'Point'],
                paint: {
                  'circle-radius': 4,
                  'circle-color': ['coalesce', ['get', 'color'], '#3B82F6'],
                  'circle-stroke-width': 1.5,
                  'circle-stroke-color': '#ffffff'
                }
              });

              updatePipTemporalFilter(currentYear);
            } catch (err) {
              console.warn('PIP layers init error:', err);
            }
          });
        } catch (e) {
          console.warn('MapLibre PIP Map fallback:', e);
        }
      }

      function updatePipTemporalFilter(year) {
        if (!pipMapInstance) return;
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

        if (pipMapInstance.getLayer('pip-braudel-polygons')) {
          pipMapInstance.setFilter('pip-braudel-polygons', ['all', polyGeom, fromFilter, toFilter]);
        }
        if (pipMapInstance.getLayer('pip-braudel-polygon-outline')) {
          pipMapInstance.setFilter('pip-braudel-polygon-outline', ['all', polyGeom, fromFilter, toFilter]);
        }
        if (pipMapInstance.getLayer('pip-braudel-lines')) {
          pipMapInstance.setFilter('pip-braudel-lines', ['all', lineGeom, fromFilter, toFilter]);
        }
        if (pipMapInstance.getLayer('pip-braudel-points')) {
          pipMapInstance.setFilter('pip-braudel-points', ['all', pointGeom, fromFilter, toFilter]);
        }
      }

      document.getElementById('btn-slide-split-mode')?.addEventListener('click', toggleSplitMode);
      document.getElementById('slide-pip-minimap')?.addEventListener('click', toggleSplitMode);

      function toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        const icon = document.getElementById('icon-theme');
        if (icon) icon.innerText = isLight ? '☀️' : '🌙';

        if (map && map.isStyleLoaded()) {
          applyStandalonePaintOverrides();
        }
      }

      document.getElementById('btn-recenter-step')?.addEventListener('click', recenterCurrentStep);
      document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
      document.getElementById('btn-prev')?.addEventListener('click', () => {
        if (currentWaypointIdx > 0) goToWaypoint(doc.waypoints[currentWaypointIdx - 1].id);
      });
      document.getElementById('btn-next')?.addEventListener('click', () => {
        if (currentWaypointIdx < doc.waypoints.length - 1) goToWaypoint(doc.waypoints[currentWaypointIdx + 1].id);
      });
      const bindCloseBtn = (id, fn) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            fn();
          };
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            fn();
          });
        }
      };

      bindCloseBtn('btn-slide-close', closeSlideAndReturn);
      bindCloseBtn('btn-return-map', closeSlideAndReturn);
      bindCloseBtn('btn-editor-close', closeSlideEditor);
      bindCloseBtn('btn-close-legend', closeLegend);
      bindCloseBtn('wiki-close-btn', closeWiki);

      document.getElementById('btn-present')?.addEventListener('click', togglePresentMode);
      document.getElementById('btn-save-deck')?.addEventListener('click', saveDeck);
      document.getElementById('btn-toggle-legend')?.addEventListener('click', toggleLegend);
      document.getElementById('btn-edit-current-slide')?.addEventListener('click', () => {
        if (currentContext && currentContext.activeSlideId) {
          openSlideEditor(currentContext.activeSlideId);
        } else if (doc.slides && doc.slides.length > 0) {
          openSlideEditor(doc.slides[0].id);
        }
      });
      document.getElementById('btn-editor-save')?.addEventListener('click', saveCurrentSlideFromEditor);

      // Outils d'insertion du ruban de l'éditeur
      document.getElementById('btn-editor-add-title')?.addEventListener('click', () => addEditorElement('title'));
      document.getElementById('btn-editor-add-text')?.addEventListener('click', () => addEditorElement('text'));
      document.getElementById('btn-editor-add-image')?.addEventListener('click', () => addEditorElement('image'));
      document.getElementById('btn-editor-add-video')?.addEventListener('click', () => addEditorElement('video'));
      document.getElementById('btn-editor-add-diagram')?.addEventListener('click', () => addEditorElement('diagram'));
      document.getElementById('btn-editor-add-rect')?.addEventListener('click', () => addEditorElement('rect'));
      document.getElementById('btn-editor-add-circle')?.addEventListener('click', () => addEditorElement('circle'));
      document.getElementById('btn-editor-add-arrow')?.addEventListener('click', () => addEditorElement('arrow'));
      document.getElementById('btn-editor-add-pill')?.addEventListener('click', () => addEditorElement('pill'));
      document.getElementById('editor-slide-bgcolor')?.addEventListener('input', (e) => {
        const stage = document.getElementById('editor-canvas-stage');
        if (stage) stage.style.backgroundColor = e.target.value;
      });
    }

    // --- MOTEUR ÉDITEUR DE DIAPOSITIVE POWERPOINT EMBARQUÉ ---
    let editingSlide = null;
    let selectedElementId = null;
    let isDraggingElement = false;
    let isResizingElement = false;
    let resizeHandleDir = null;
    let dragStartPos = { x: 0, y: 0 };
    let initialElementBounds = { x: 0, y: 0, w: 0, h: 0 };

    function initEditorTabs() {
      const tabPropBtn = document.getElementById('tab-btn-properties');
      const tabLayersBtn = document.getElementById('tab-btn-layers');
      const panelProp = document.getElementById('tab-panel-properties');
      const panelLayers = document.getElementById('tab-panel-layers');

      if (tabPropBtn && tabLayersBtn && panelProp && panelLayers) {
        tabPropBtn.onclick = () => {
          tabPropBtn.classList.add('active');
          tabLayersBtn.classList.remove('active');
          panelProp.classList.add('active');
          panelLayers.classList.remove('active');
        };
        tabLayersBtn.onclick = () => {
          tabLayersBtn.classList.add('active');
          tabPropBtn.classList.remove('active');
          panelLayers.classList.add('active');
          panelProp.classList.remove('active');
          renderLayersList();
        };
      }

      // Actions d'empilement global
      document.getElementById('btn-layer-top')?.addEventListener('click', () => changeSelectedElementLayer('top'));
      document.getElementById('btn-layer-up')?.addEventListener('click', () => changeSelectedElementLayer('up'));
      document.getElementById('btn-layer-down')?.addEventListener('click', () => changeSelectedElementLayer('down'));
      document.getElementById('btn-layer-bottom')?.addEventListener('click', () => changeSelectedElementLayer('bottom'));
      document.getElementById('btn-editor-toggle-ratio')?.addEventListener('click', () => {
        if (!editingSlide) return;
        editingSlide.aspectRatio = editingSlide.aspectRatio === '9:16' ? '16:9' : '9:16';
        updateEditorRatioUI();
        renderEditorStage();
        renderInspector();
      });
    }

    function updateEditorRatioUI() {
      if (!editingSlide) return;
      if (!editingSlide.aspectRatio) {
        editingSlide.aspectRatio = isSidecarMode ? '9:16' : '16:9';
      }
      const isPortrait = editingSlide.aspectRatio === '9:16';
      const ratioLabel = document.getElementById('editor-ratio-label');
      const subtitleLbl = document.querySelector('#slide-editor-modal .ribbon-title-section span');
      if (ratioLabel) ratioLabel.innerText = isPortrait ? '9:16 Portrait' : '16:9 Paysage';
      if (subtitleLbl) {
        subtitleLbl.innerText = isPortrait 
          ? 'Format Portrait 9:16 (540×960px) • Homothétie vectorielle 1-to-1' 
          : 'Format Paysage 16:9 (960×540px) • Homothétie vectorielle 1-to-1';
      }
    }

    function openSlideEditor(slideId) {
      const slide = doc.slides.find(s => s.id === slideId);
      if (!slide) return;
      editingSlide = JSON.parse(JSON.stringify(slide)); // Clone de travail
      selectedElementId = null;

      const modal = document.getElementById('slide-editor-modal');
      const titleLbl = document.getElementById('editor-modal-slide-title');
      if (titleLbl) titleLbl.innerText = 'Éditeur : ' + (slide.title || 'Diapositive');

      updateEditorRatioUI();

      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.remove('sidecar-editor-compact');
      }

      const stage = document.getElementById('editor-canvas-stage');
      if (stage && slide.background) {
        stage.style.backgroundColor = slide.background.type === 'color' ? slide.background.value : '#1e293b';
        const bgInput = document.getElementById('editor-slide-bgcolor');
        if (bgInput && slide.background.type === 'color') bgInput.value = slide.background.value;
      }

      initEditorTabs();
      renderEditorStage();
      renderInspector();
      renderLayersList();
    }

    function closeSlideEditor() {
      const modal = document.getElementById('slide-editor-modal');
      if (modal) modal.classList.add('hidden');
      editingSlide = null;
      selectedElementId = null;
    }

    function saveCurrentSlideFromEditor() {
      if (!editingSlide) return;
      const idx = doc.slides.findIndex(s => s.id === editingSlide.id);
      const bgInput = document.getElementById('editor-slide-bgcolor');
      if (bgInput) {
        editingSlide.background = { type: 'color', value: bgInput.value };
      }
      if (idx !== -1) {
        doc.slides[idx] = JSON.parse(JSON.stringify(editingSlide));
      } else {
        doc.slides.push(JSON.parse(JSON.stringify(editingSlide)));
      }
      // Re-render la vue diapositive si active
      renderSlideContent(editingSlide);
      if (typeof currentWaypointIdx === 'number' && doc.waypoints && doc.waypoints[currentWaypointIdx]) {
        goToWaypoint(doc.waypoints[currentWaypointIdx].id, false);
      }
      closeSlideEditor();
    }

    function renderEditorStage() {
      const stage = document.getElementById('editor-canvas-stage');
      const wrapper = document.getElementById('editor-canvas-wrapper');
      if (!stage || !editingSlide) return;

      const isPortrait = editingSlide.aspectRatio === '9:16';
      const targetW = isPortrait ? 540 : 960;
      const targetH = isPortrait ? 960 : 540;

      stage.style.width = targetW + 'px';
      stage.style.height = targetH + 'px';

      if (wrapper) {
        const wrapRect = wrapper.getBoundingClientRect();
        if (wrapRect.width > 0 && wrapRect.height > 0) {
          const availW = wrapRect.width - 32;
          const availH = wrapRect.height - 32;
          const scale = Math.min(1, Math.min(availW / targetW, availH / targetH));
          stage.style.transform = 'scale(' + scale + ')';
          stage.style.transformOrigin = 'center center';
        }
      }

      stage.querySelectorAll('.slide-editor-element').forEach(el => el.remove());
      const elements = editingSlide.elements || [];

      // Trier les éléments par zIndex pour un rendu propre
      const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      sortedElements.forEach(elem => {
        if (elem.hidden) return; // Ne pas afficher si masqué

        const el = document.createElement('div');
        const isSelected = elem.id === selectedElementId;
        el.className = 'slide-editor-element' + (isSelected ? ' selected' : '') + (elem.locked ? ' locked' : '');
        el.id = 'editor-el-' + elem.id;
        el.style.left = (elem.x ?? 40) + 'px';
        el.style.top = (elem.y ?? 40) + 'px';
        el.style.width = (elem.w ?? 200) + 'px';
        el.style.height = (elem.h ?? 80) + 'px';
        el.style.zIndex = elem.zIndex || 1;
        el.style.opacity = elem.opacity !== undefined ? elem.opacity : 1;
        el.style.color = elem.color || '#f8fafc';
        el.style.fontSize = (elem.fontSize || 16) + 'px';
        el.style.fontWeight = elem.fontWeight || 'normal';
        el.style.textAlign = elem.align || 'left';
        el.style.borderRadius = (elem.shapeType === 'circle' ? '50%' : (elem.borderRadius || 6) + 'px');
        el.style.backgroundColor = elem.backgroundColor || (elem.type === 'shape' ? 'rgba(59, 130, 246, 0.2)' : 'transparent');
        el.style.border = (elem.borderWidth || 1) + 'px ' + (elem.type === 'shape' ? 'solid ' : 'dashed ') + (elem.borderColor || elem.color || '#3B82F6');
        el.style.padding = elem.type === 'shape' ? '0' : '8px 12px';
        el.style.overflow = 'hidden';

        if (elem.type === 'text' || !elem.type) {
          el.innerText = elem.content || elem.text || elem.title || 'Texte...';
          // Écriture directe au double-clic dans la zone de texte (Point 1)
          el.ondblclick = (e) => {
            e.stopPropagation();
            el.contentEditable = 'true';
            el.focus();
            el.onblur = () => {
              el.contentEditable = 'false';
              elem.content = el.innerText;
              const inp = document.getElementById('insp-content');
              if (inp) inp.value = elem.content;
            };
          };
        } else if (elem.type === 'image') {
          const img = document.createElement('img');
          img.src = elem.url || elem.src || '';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.borderRadius = 'inherit';
          img.draggable = false;
          el.appendChild(img);
        } else if (elem.type === 'video') {
          el.style.background = '#000';
          el.style.display = 'flex';
          el.style.flexDirection = 'column';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.innerHTML = '<span style="font-size: 24px;">🎬</span><span style="font-size: 11px; margin-top: 4px; color: #94a3b8;">Vidéo (' + (elem.videoUrl ? 'URL OK' : 'Sans URL') + ')</span>';
        } else if (elem.type === 'diagram') {
          el.style.background = elem.backgroundColor || 'rgba(30, 41, 59, 0.9)';
          el.innerHTML = '<div style="font-weight: bold; font-size: 12px; color: #38bdf8; margin-bottom: 6px;">📊 ' + (elem.title || 'Schéma') + '</div><div class="diagram-flow-container">' + parseDiagramFlowHTML(elem.content || '1. Étape A -> 2. Étape B -> 3. Étape C') + '</div>';
        } else if (elem.type === 'shape') {
          if (elem.content) {
            el.innerText = elem.content;
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
          }
        }

        // 8 Poignées de redimensionnement interactives si sélectionné et non verrouillé
        if (isSelected && !elem.locked) {
          const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
          handles.forEach(dir => {
            const h = document.createElement('div');
            h.className = 'resize-handle handle-' + dir;
            h.onmousedown = (e) => {
              e.stopPropagation();
              isResizingElement = true;
              resizeHandleDir = dir;
              dragStartPos = { x: e.clientX, y: e.clientY };
              initialElementBounds = { x: elem.x ?? 40, y: elem.y ?? 40, w: elem.w ?? 200, h: elem.h ?? 80 };
            };
            el.appendChild(h);
          });
        }

        // Événement clic et drag direct (si non verrouillé)
        el.onmousedown = (e) => {
          e.stopPropagation();
          selectedElementId = elem.id;
          if (!elem.locked) {
            isDraggingElement = true;
            dragStartPos = { x: e.clientX, y: e.clientY };
            initialElementBounds = { x: elem.x ?? 40, y: elem.y ?? 40, w: elem.w ?? 200, h: elem.h ?? 80 };
            el.classList.add('dragging');
          }
          renderEditorStage();
          renderInspector();
          renderLayersList();
        };

        stage.appendChild(el);
      });

      // Gestion globale du déplacement et redimensionnement
      stage.onmousemove = (e) => {
        if (!selectedElementId || !editingSlide) return;
        const cur = editingSlide.elements.find(el => el.id === selectedElementId);
        if (!cur || cur.locked) return;

        const isPortrait = editingSlide.aspectRatio === '9:16';
        const targetW = isPortrait ? 540 : 960;
        const targetH = isPortrait ? 960 : 540;

        const stageRect = stage.getBoundingClientRect();
        const scale = stageRect.width > 0 ? (stageRect.width / targetW) : 1;
        const dx = (e.clientX - dragStartPos.x) / scale;
        const dy = (e.clientY - dragStartPos.y) / scale;

        const snap = (v) => Math.round(v / 10) * 10;
        const guideX = document.getElementById('guide-center-x');
        const guideY = document.getElementById('guide-center-y');

        if (isDraggingElement) {
          cur.x = snap(Math.max(0, Math.min(targetW - (cur.w || 100), initialElementBounds.x + dx)));
          cur.y = snap(Math.max(0, Math.min(targetH - (cur.h || 50), initialElementBounds.y + dy)));

          // Détection d'alignement au centre horizontal/vertical (Guides intelligents PowerPoint)
          const centerX = cur.x + (cur.w || 100) / 2;
          const centerY = cur.y + (cur.h || 50) / 2;
          if (guideX) {
            if (Math.abs(centerX - (targetW / 2)) < 8) {
              guideX.classList.remove('hidden');
            } else {
              guideX.classList.add('hidden');
            }
          }
          if (guideY) {
            if (Math.abs(centerY - (targetH / 2)) < 8) {
              guideY.classList.remove('hidden');
            } else {
              guideY.classList.add('hidden');
            }
          }

          const domEl = document.getElementById('editor-el-' + cur.id);
          if (domEl) {
            domEl.style.left = cur.x + 'px';
            domEl.style.top = cur.y + 'px';
          }
        } else if (isResizingElement && resizeHandleDir) {
          if (guideX) guideX.classList.add('hidden');
          if (guideY) guideY.classList.add('hidden');

          let newX = initialElementBounds.x;
          let newY = initialElementBounds.y;
          let newW = initialElementBounds.w;
          let newH = initialElementBounds.h;

          if (resizeHandleDir.includes('e')) newW = Math.max(30, initialElementBounds.w + dx);
          if (resizeHandleDir.includes('s')) newH = Math.max(20, initialElementBounds.h + dy);
          if (resizeHandleDir.includes('w')) {
            const potentialW = Math.max(30, initialElementBounds.w - dx);
            newX = initialElementBounds.x + (initialElementBounds.w - potentialW);
            newW = potentialW;
          }
          if (resizeHandleDir.includes('n')) {
            const potentialH = Math.max(20, initialElementBounds.h - dy);
            newY = initialElementBounds.y + (initialElementBounds.h - potentialH);
            newH = potentialH;
          }

          cur.x = snap(Math.max(0, newX));
          cur.y = snap(Math.max(0, newY));
          cur.w = snap(Math.min(targetW - cur.x, newW));
          cur.h = snap(Math.min(targetH - cur.y, newH));

          const domEl = document.getElementById('editor-el-' + cur.id);
          if (domEl) {
            domEl.style.left = cur.x + 'px';
            domEl.style.top = cur.y + 'px';
            domEl.style.width = cur.w + 'px';
            domEl.style.height = cur.h + 'px';
          }
        }
      };

      window.onmouseup = () => {
        const guideX = document.getElementById('guide-center-x');
        const guideY = document.getElementById('guide-center-y');
        if (guideX) guideX.classList.add('hidden');
        if (guideY) guideY.classList.add('hidden');

        if (isDraggingElement || isResizingElement) {
          isDraggingElement = false;
          isResizingElement = false;
          resizeHandleDir = null;
          renderEditorStage();
          renderInspector();
        }
      };
    }

    function changeSelectedElementLayer(action) {
      if (!editingSlide || !selectedElementId) return;
      const elements = editingSlide.elements || [];
      const idx = elements.findIndex(e => e.id === selectedElementId);
      if (idx === -1) return;

      const elem = elements[idx];
      if (action === 'top') {
        const maxZ = Math.max(...elements.map(e => e.zIndex || 1), 1);
        elem.zIndex = maxZ + 1;
      } else if (action === 'bottom') {
        const minZ = Math.min(...elements.map(e => e.zIndex || 1), 1);
        elem.zIndex = Math.max(1, minZ - 1);
      } else if (action === 'up') {
        elem.zIndex = (elem.zIndex || 1) + 1;
      } else if (action === 'down') {
        elem.zIndex = Math.max(1, (elem.zIndex || 1) - 1);
      }

      renderEditorStage();
      renderLayersList();
    }

    function renderLayersList() {
      const container = document.getElementById('layers-list-container');
      if (!container || !editingSlide) return;
      container.innerHTML = '';

      const elements = editingSlide.elements || [];
      // Afficher du premier plan au fond (ordre inverse du rendu)
      const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

      if (sorted.length === 0) {
        container.innerHTML = '<p style="font-size: 0.75rem; opacity: 0.6; font-style: italic;">Aucun élément.</p>';
        return;
      }

      sorted.forEach(elem => {
        const item = document.createElement('div');
        item.className = 'layer-item' + (elem.id === selectedElementId ? ' active' : '') + (elem.locked ? ' locked' : '');
        
        const typeIcon = elem.type === 'image' ? '🖼️' : elem.type === 'video' ? '🎬' : elem.type === 'diagram' ? '📊' : elem.type === 'shape' ? '⬛' : '📄';
        const label = elem.title || elem.content || elem.name || (elem.type + ' #' + elem.id.slice(-4));
        const shortLabel = label.length > 18 ? label.slice(0, 18) + '...' : label;

        item.innerHTML = '<div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">' +
          '<span>' + typeIcon + '</span>' +
          '<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + shortLabel + '</span>' +
          '</div>' +
          '<div class="layer-item-controls">' +
          '<button class="layer-icon-btn btn-lock-layer" title="' + (elem.locked ? 'Déverrouiller' : 'Verrouiller') + '">' + (elem.locked ? '🔒' : '🔓') + '</button>' +
          '<button class="layer-icon-btn btn-vis-layer" title="' + (elem.hidden ? 'Afficher' : 'Masquer') + '">' + (elem.hidden ? '🙈' : '👁️') + '</button>' +
          '</div>';

        item.onclick = (e) => {
          if (e.target.closest('.layer-icon-btn')) return;
          selectedElementId = elem.id;
          renderEditorStage();
          renderInspector();
          renderLayersList();
        };

        const lockBtn = item.querySelector('.btn-lock-layer');
        if (lockBtn) {
          lockBtn.onclick = (e) => {
            e.stopPropagation();
            elem.locked = !elem.locked;
            renderEditorStage();
            renderLayersList();
            renderInspector();
          };
        }

        const visBtn = item.querySelector('.btn-vis-layer');
        if (visBtn) {
          visBtn.onclick = (e) => {
            e.stopPropagation();
            elem.hidden = !elem.hidden;
            renderEditorStage();
            renderLayersList();
          };
        }

        container.appendChild(item);
      });
    }

    function renderInspector() {
      const panel = document.getElementById('inspector-content');
      if (!panel) return;
      if (!editingSlide || !selectedElementId) {
        panel.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.6; font-style: italic;">Sélectionnez un élément sur la diapositive pour le modifier ou le repositionner.</p>';
        return;
      }

      const elem = editingSlide.elements.find(e => e.id === selectedElementId);
      if (!elem) return;

      let html = '<div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">';
      html += '<strong style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-color);">' + elem.type + (elem.locked ? ' 🔒' : '') + '</strong>';
      html += '<button id="btn-elem-delete" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem;">🗑️ Supprimer</button>';
      html += '</div>';

      if (elem.type === 'text' || !elem.type) {
        html += '<div class="inspector-field-group"><label class="inspector-label">Texte</label><textarea id="insp-content" class="inspector-input" rows="3">' + (elem.content || '') + '</textarea></div>';
      } else if (elem.type === 'image') {
        html += '<div class="inspector-field-group"><label class="inspector-label">URL Image</label><input type="text" id="insp-url" class="inspector-input" value="' + (elem.url || elem.src || '') + '"/></div>';
        html += '<div class="inspector-field-group"><label class="inspector-label">Ajustement du Ratio</label>';
        html += '<select id="insp-objectfit" class="inspector-input">';
        html += '<option value="contain"' + ((elem.objectFit || 'contain') === 'contain' ? ' selected' : '') + '>📐 Ajuster sans rognage (contain)</option>';
        html += '<option value="cover"' + (elem.objectFit === 'cover' ? ' selected' : '') + '>✂️ Remplir le cadre (cover)</option>';
        html += '<option value="fill"' + (elem.objectFit === 'fill' ? ' selected' : '') + '>↔️ Étirer (fill)</option>';
        html += '</select></div>';
        html += '<button id="btn-insp-reset-aspect" class="tool-btn" style="width: 100%; font-size: 0.72rem; margin-top: 4px; padding: 4px 6px;">🎯 Caler sur le ratio naturel d\\\'origine</button>';
      } else if (elem.type === 'video') {
        html += '<div class="inspector-field-group"><label class="inspector-label">URL Vidéo (YouTube / MP4)</label><input type="text" id="insp-videourl" class="inspector-input" value="' + (elem.videoUrl || '') + '"/></div>';
      } else if (elem.type === 'diagram') {
        html += '<div class="inspector-field-group"><label class="inspector-label">Titre Schéma</label><input type="text" id="insp-title" class="inspector-input" value="' + (elem.title || '') + '"/></div>';
        html += '<div class="inspector-field-group"><label class="inspector-label">Étapes / Flux</label><textarea id="insp-content" class="inspector-input" rows="2">' + (elem.content || '') + '</textarea></div>';
      }

      html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">';
      html += '<div class="inspector-field-group"><label class="inspector-label">Position X</label><input type="number" id="insp-x" class="inspector-input" value="' + (elem.x || 0) + '"/></div>';
      html += '<div class="inspector-field-group"><label class="inspector-label">Position Y</label><input type="number" id="insp-y" class="inspector-input" value="' + (elem.y || 0) + '"/></div>';
      html += '<div class="inspector-field-group"><label class="inspector-label">Largeur (W)</label><input type="number" id="insp-w" class="inspector-input" value="' + (elem.w || 100) + '"/></div>';
      html += '<div class="inspector-field-group"><label class="inspector-label">Hauteur (H)</label><input type="number" id="insp-h" class="inspector-input" value="' + (elem.h || 50) + '"/></div>';
      html += '</div>';

      // Opacité & Transparence
      const currentOpacity = elem.opacity !== undefined ? Math.round(elem.opacity * 100) : 100;
      html += '<div class="inspector-field-group">';
      html += '<div style="display: flex; justify-content: space-between;"><label class="inspector-label">Opacité</label><span id="insp-opacity-val" style="font-size: 0.72rem; opacity: 0.8;">' + currentOpacity + '%</span></div>';
      html += '<input type="range" id="insp-opacity" min="5" max="100" value="' + currentOpacity + '" style="accent-color: var(--accent-color); cursor: pointer;"/>';
      html += '</div>';

      html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">';
      html += '<div class="inspector-field-group"><label class="inspector-label">Taille Police</label><input type="number" id="insp-fontsize" class="inspector-input" value="' + (elem.fontSize || 16) + '"/></div>';
      html += '<div class="inspector-field-group"><label class="inspector-label">Couleur Texte/Trait</label><input type="color" id="insp-color" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer;" value="' + (elem.color || elem.borderColor || '#ffffff') + '"/></div>';
      html += '</div>';

      if (elem.type === 'shape' || elem.shapeType || elem.type === 'diagram') {
        html += '<div class="inspector-field-group"><label class="inspector-label">Couleur de Remplissage (Fond)</label><input type="color" id="insp-bgcolor" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer;" value="' + (elem.backgroundColor || '#3b82f6') + '"/></div>';
      }

      panel.innerHTML = html;

      // Bind events inspecteur
      document.getElementById('btn-elem-delete')?.addEventListener('click', () => {
        editingSlide.elements = editingSlide.elements.filter(e => e.id !== selectedElementId);
        selectedElementId = null;
        renderEditorStage();
        renderInspector();
        renderLayersList();
      });
      document.getElementById('insp-content')?.addEventListener('input', (e) => {
        elem.content = e.target.value;
        renderEditorStage();
      });
      document.getElementById('insp-title')?.addEventListener('input', (e) => {
        elem.title = e.target.value;
        renderEditorStage();
      });
      document.getElementById('insp-url')?.addEventListener('input', (e) => {
        elem.url = e.target.value;
        renderEditorStage();
      });
      document.getElementById('insp-objectfit')?.addEventListener('change', (e) => {
        elem.objectFit = e.target.value;
        renderEditorStage();
      });
      document.getElementById('btn-insp-reset-aspect')?.addEventListener('click', () => {
        const iUrl = elem.url || elem.src;
        if (!iUrl) return;
        const tempImg = new Image();
        tempImg.onload = () => {
          if (tempImg.naturalWidth && tempImg.naturalHeight) {
            const aspect = tempImg.naturalWidth / tempImg.naturalHeight;
            const currentW = elem.w || 260;
            elem.h = Math.round(currentW / aspect);
            renderEditorStage();
            renderInspector();
          }
        };
        tempImg.src = iUrl;
      });
      document.getElementById('insp-videourl')?.addEventListener('input', (e) => {
        elem.videoUrl = e.target.value;
        renderEditorStage();
      });
      document.getElementById('insp-x')?.addEventListener('change', (e) => { elem.x = Number(e.target.value); renderEditorStage(); });
      document.getElementById('insp-y')?.addEventListener('change', (e) => { elem.y = Number(e.target.value); renderEditorStage(); });
      document.getElementById('insp-w')?.addEventListener('change', (e) => { elem.w = Number(e.target.value); renderEditorStage(); });
      document.getElementById('insp-h')?.addEventListener('change', (e) => { elem.h = Number(e.target.value); renderEditorStage(); });
      document.getElementById('insp-fontsize')?.addEventListener('change', (e) => { elem.fontSize = Number(e.target.value); renderEditorStage(); });
      document.getElementById('insp-color')?.addEventListener('input', (e) => { 
        elem.color = e.target.value; 
        if (elem.type === 'shape') elem.borderColor = e.target.value;
        renderEditorStage(); 
      });
      document.getElementById('insp-bgcolor')?.addEventListener('input', (e) => { 
        elem.backgroundColor = e.target.value; 
        renderEditorStage(); 
      });
      document.getElementById('insp-opacity')?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        elem.opacity = val / 100;
        const valLbl = document.getElementById('insp-opacity-val');
        if (valLbl) valLbl.innerText = val + '%';
        const domEl = document.getElementById('editor-el-' + elem.id);
        if (domEl) domEl.style.opacity = String(elem.opacity);
      });
    }

    function addEditorElement(type) {
      if (!editingSlide) return;
      if (!editingSlide.elements) editingSlide.elements = [];

      const isPortrait = editingSlide ? (editingSlide.aspectRatio === '9:16') : isSidecarMode;
      const newId = type + '-' + Date.now();
      let newElem = {
        id: newId,
        type: (type === 'title' || type === 'text') ? 'text' : type === 'rect' || type === 'circle' ? 'shape' : type,
        x: isPortrait ? 40 : 80,
        y: isPortrait ? 50 : 80,
        w: isPortrait 
          ? (type === 'title' ? 460 : type === 'diagram' ? 460 : 260)
          : (type === 'title' ? 500 : type === 'diagram' ? 400 : 260),
        h: isPortrait
          ? (type === 'title' ? 70 : type === 'diagram' ? 160 : 180)
          : (type === 'title' ? 60 : type === 'diagram' ? 140 : 160),
        color: '#f8fafc',
        opacity: 1,
        zIndex: editingSlide.elements.length + 1
      };

      if (type === 'title') {
        newElem.content = 'Titre de la Diapositive';
        newElem.fontSize = isPortrait ? 26 : 28;
        newElem.fontWeight = 'bold';
      } else if (type === 'text') {
        newElem.content = 'Texte explicatif ou citation historique...';
        newElem.fontSize = 16;
      } else if (type === 'image') {
        newElem.url = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80';
      } else if (type === 'video') {
        newElem.videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      } else if (type === 'diagram') {
        newElem.title = 'Flux Stratégique';
        newElem.content = '1. Traité initial → 2. Mobilisation → 3. Paix';
        newElem.backgroundColor = 'rgba(30, 41, 59, 0.9)';
      } else if (type === 'rect') {
        newElem.shapeType = 'rectangle';
        newElem.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        newElem.borderColor = '#3B82F6';
      } else if (type === 'circle') {
        newElem.shapeType = 'circle';
        newElem.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        newElem.borderColor = '#3B82F6';
      } else if (type === 'arrow') {
        newElem.shapeType = 'arrow';
        newElem.type = 'shape';
        newElem.w = isPortrait ? 300 : 320;
        newElem.h = 50;
        newElem.content = '➔ Axe Stratégique';
        newElem.backgroundColor = 'rgba(239, 68, 68, 0.25)';
        newElem.borderColor = '#ef4444';
      } else if (type === 'pill') {
        newElem.content = '🏷️ Cartouche / Période Clé';
        newElem.fontSize = 14;
        newElem.fontWeight = 'bold';
        newElem.color = '#f8fafc';
        newElem.borderRadius = 20;
        newElem.backgroundColor = 'rgba(99, 102, 241, 0.3)';
        newElem.borderColor = '#6366f1';
      }

      editingSlide.elements.push(newElem);
      selectedElementId = newId;
      renderEditorStage();
      renderInspector();
      renderLayersList();
    }

    function saveDeck() {
      const rawHtml = document.documentElement.outerHTML;
      const scriptTagRegex = /<script type="application\\/arda\\+json" id="arda-doc">([\\s\\S]*?)<\\/script>/i;
      const updatedJson = JSON.stringify(doc, null, 2);
      
      let updatedHtml;
      if (scriptTagRegex.test(rawHtml)) {
        updatedHtml = rawHtml.replace(scriptTagRegex, '<script type="application/arda+json" id="arda-doc">' + updatedJson + '<' + '/script>');
      } else {
        // Fallback d'injection si la balise n'a pas été reconnue exactement
        updatedHtml = rawHtml.replace('</body>', '<script type="application/arda+json" id="arda-doc">' + updatedJson + '<' + '/script></body>');
      }

      const blob = new Blob([updatedHtml], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = (doc.title || 'carte-recit').toLowerCase().replace(/[^a-z0-9_-]/gi, '_') + '-edited.html';
      link.click();
    }

    function initWiki() {
      const wikiCloseBtn = document.getElementById('wiki-close-btn');
      if (wikiCloseBtn) wikiCloseBtn.onclick = closeWiki;

      map.on('click', 'braudel-points', (e) => {
        if (e.features && e.features[0]) openWiki(e.features[0]);
      });
      map.on('click', 'braudel-polygons', (e) => {
        if (e.features && e.features[0]) openWiki(e.features[0]);
      });
    }

    function openWiki(feature) {
      const modal = document.getElementById('wiki-modal');
      if (!modal) return;
      const p = feature.properties || {};
      document.getElementById('wiki-title').innerText = p.name || p.NAME || 'Entité';
      document.getElementById('wiki-body').innerText = p.wikiContent || p.description || 'Entité géopolitique et historique de Braudel.';
      modal.classList.add('open');
      history.replaceState(null, '', '#/wiki/' + (feature.id || p.id || ''));
    }

    function closeWiki() {
      const modal = document.getElementById('wiki-modal');
      if (modal) modal.classList.remove('open');
    }
  `;
}

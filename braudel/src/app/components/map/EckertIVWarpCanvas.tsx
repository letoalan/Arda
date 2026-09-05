// src/app/components/map/EckertIVWarpCanvas.tsx

import React, { useEffect, useRef, useState } from 'react';
import { mapService } from '../../../services/cartography/map-service';
import { eckertIVPixelToGeo } from '../../../acquisition/projection';

export interface EckertTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface EckertIVWarpCanvasProps {
  visible?: boolean;
  isTransitioning?: boolean;
  transform?: EckertTransform;
  onTransformChange?: (t: EckertTransform | ((prev: EckertTransform) => EckertTransform)) => void;
  onTransitionToGlobe?: (geo: { lon: number; lat: number }, screenPos?: { x: number; y: number }) => void;
}

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;
  uniform sampler2D u_mapTexture;
  uniform vec2 u_resolution;
  uniform vec4 u_aspectBox;   // [cx, cy, halfW, halfH]
  uniform vec4 u_worldBounds; // [uMin, vMin, uMax, vMax]
  uniform vec3 u_transform;   // [panX, panY, zoom]

  const float PI = 3.141592653589793;
  const float CX = 0.4222382000918; // 2 / sqrt(4*pi + pi^2)
  const float CY = 1.3265004281770; // 2 * sqrt(pi / (4 + pi))
  const float CEQ = 3.5707963267949; // 2 + pi/2

  void main() {
    // Coordonnées d'écran (origine en haut à gauche)
    vec2 screenPos = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
    vec2 screenCenter = u_aspectBox.xy;

    // Dé-transformation : inversion du zoom et de la translation pan
    float zoom = max(u_transform.z, 0.001);
    vec2 unpanned = screenPos - screenCenter - u_transform.xy;
    vec2 posInBox = unpanned / zoom;

    // Position normalisée relative au cadre centré 2:1
    vec2 norm = posInBox / u_aspectBox.zw; // x_norm in [-1, 1], y_norm in [-1, 1]
    
    float x_norm = norm.x;
    float y_norm = -norm.y; // +1 = Nord, -1 = Sud

    // Hors de la hauteur utile des pôles
    if (abs(y_norm) > 1.0) {
      gl_FragColor = vec4(0.027, 0.043, 0.078, 1.0);
      return;
    }

    // 1. Inversion analytique d'Eckert IV (theta)
    float clampedY = clamp(y_norm, -0.999999, 0.999999);
    float theta = asin(clampedY);
    float cosTheta = cos(theta);

    // 2. Longitude lambda en radians
    float X = x_norm * (2.0 * CY);
    float denom = CX * (1.0 + cosTheta);
    if (denom < 1e-6) {
      gl_FragColor = vec4(0.027, 0.043, 0.078, 1.0);
      return;
    }
    float lambda = X / denom;

    // Hors des méridiens limites +-180°
    if (abs(lambda) > PI) {
      gl_FragColor = vec4(0.027, 0.043, 0.078, 1.0);
      return;
    }

    // 3. Latitude phi en radians
    float sinPhi = (theta + clampedY * cosTheta + 2.0 * clampedY) / CEQ;
    float phi = asin(clamp(sinPhi, -1.0, 1.0));

    // 4. Coordonnées de projection Web Mercator normalisées [0, 1]
    float u_merc = (lambda / PI + 1.0) * 0.5;

    // Clamping de latitude Web Mercator standard (+-85.05112878°)
    float phi_clamped = clamp(phi, -1.4844222, 1.4844222);
    float mercN = log(tan(0.785398163 + phi_clamped * 0.5));
    float v_merc = 0.5 - mercN / (2.0 * PI);

    // 5. Mappage vers les coordonnées UV réelles de la boîte du monde dans mapCanvas
    float texU = mix(u_worldBounds.x, u_worldBounds.z, clamp(u_merc, 0.0, 1.0));
    float texV = mix(u_worldBounds.y, u_worldBounds.w, clamp(v_merc, 0.0, 1.0));

    // Si les coordonnées tombent en dehors du canevas MapLibre actif
    if (texU < 0.0 || texU > 1.0 || texV < 0.0 || texV > 1.0) {
      gl_FragColor = vec4(0.027, 0.043, 0.078, 1.0);
      return;
    }

    vec4 mapColor = texture2D(u_mapTexture, vec2(clamp(texU, 0.001, 0.999), clamp(texV, 0.001, 0.999)));
    gl_FragColor = mapColor;
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  try {
    if (!gl || (typeof gl.isContextLost === 'function' && gl.isContextLost())) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('EckertIVWarp Shader compilation failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  } catch (e) {
    console.warn('Exception during shader creation:', e);
    return null;
  }
}

const EckertIVWarpCanvasInternal: React.FC<EckertIVWarpCanvasProps> = ({
  visible = true,
  isTransitioning = false,
  transform,
  onTransformChange,
  onTransitionToGlobe
}) => {
  const [internalTransform, setInternalTransform] = useState<EckertTransform>({
    zoom: 1.0,
    panX: 0,
    panY: 0
  });

  const currentTransform = transform || internalTransform;
  const updateTransform = onTransformChange || setInternalTransform;

  const currentTransformRef = useRef<EckertTransform>(currentTransform);
  currentTransformRef.current = currentTransform;

  const onTransitionToGlobeRef = useRef(onTransitionToGlobe);
  onTransitionToGlobeRef.current = onTransitionToGlobe;

  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number; panX: number; panY: number; zoom: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const vertexShaderRef = useRef<WebGLShader | null>(null);
  const fragmentShaderRef = useRef<WebGLShader | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isRenderingRef = useRef<boolean>(false);
  const doRenderRef = useRef<(() => void) | null>(null);

  const isTransitioningRef = useRef<boolean>(isTransitioning);
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Nettoyage définitif des ressources GPU au démontage complet du composant
  useEffect(() => {
    return () => {
      const gl = glRef.current;
      if (gl && (!gl.isContextLost || !gl.isContextLost())) {
        try {
          if (textureRef.current) gl.deleteTexture(textureRef.current);
          if (positionBufferRef.current) gl.deleteBuffer(positionBufferRef.current);
          if (programRef.current) gl.deleteProgram(programRef.current);
          if (vertexShaderRef.current) gl.deleteShader(vertexShaderRef.current);
          if (fragmentShaderRef.current) gl.deleteShader(fragmentShaderRef.current);
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Centrer la carte MapLibre pour embrasser le planisphère mondial sans rognage polaire
    const map = mapService.getMap();
    if (map) {
      try {
        const activeCanvas = map.getCanvas();
        const mapW = activeCanvas?.clientWidth || canvas.clientWidth || window.innerWidth;
        const mapH = activeCanvas?.clientHeight || canvas.clientHeight || window.innerHeight;
        const minDim = Math.min(mapW, mapH);
        const fitWorldSize = Math.max(256, minDim * 0.94);
        const targetZoom = Math.max(0, Math.log2(fitWorldSize / 512));

        map.jumpTo({
          center: [0, 0],
          zoom: targetZoom,
          pitch: 0,
          bearing: 0
        });
      } catch (_) {}
    }

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('[EckertIVWarpCanvas] WebGL context lost intercepté.');
    };

    const handleContextRestored = () => {
      console.info('[EckertIVWarpCanvas] WebGL context restored.');
      setupWebGL();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    const setupWebGL = () => {
      try {
        const gl = canvas.getContext('webgl', { 
          alpha: true, 
          antialias: true,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        });
        if (!gl || (typeof gl.isContextLost === 'function' && gl.isContextLost())) {
          console.warn('WebGL non disponible ou contexte perdu pour EckertIVWarpCanvas.');
          return;
        }
        glRef.current = gl;

        vertexShaderRef.current = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
        fragmentShaderRef.current = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
        if (!vertexShaderRef.current || !fragmentShaderRef.current) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShaderRef.current);
        gl.attachShader(program, fragmentShaderRef.current);
        gl.linkProgram(program);

        // getProgramParameter pour un WebGLProgram
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('Program link failed:', gl.getProgramInfoLog(program));
          gl.deleteProgram(program);
          return;
        }
        programRef.current = program;

        const posBuf = gl.createBuffer();
        positionBufferRef.current = posBuf;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
          ]),
          gl.STATIC_DRAW
        );

        const aPositionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        textureRef.current = texture;

        scheduleRender();
      } catch (err) {
        console.warn('Erreur lors de l’initialisation WebGL d’EckertIVWarpCanvas:', err);
      }
    };

    const doRender = () => {
      isRenderingRef.current = false;
      const gl = glRef.current;
      const program = programRef.current;
      const texture = textureRef.current;
      const targetCanvas = canvasRef.current;
      if (!targetCanvas || !gl || !program || !texture || gl.isContextLost()) return;

      const activeMap = mapService.getMap();
      if (!activeMap) return;

      const mapCanvas = activeMap.getCanvas();
      if (!mapCanvas || mapCanvas.width === 0 || mapCanvas.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = targetCanvas.clientWidth || window.innerWidth;
      const cssH = targetCanvas.clientHeight || window.innerHeight;
      const renderW = Math.round(cssW * dpr);
      const renderH = Math.round(cssH * dpr);

      if (targetCanvas.width !== renderW || targetCanvas.height !== renderH) {
        targetCanvas.width = renderW;
        targetCanvas.height = renderH;
        gl.viewport(0, 0, renderW, renderH);
      }

      gl.useProgram(program);

      // Upload de la texture depuis mapCanvas (avec relief hillshade et masses continentales)
      // Ne pas écraser la texture pendant une transition fluide vers le Globe 3D
      if (!isTransitioningRef.current) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapCanvas);
        } catch (_) {
          return;
        }
      }

      const uMapTextureLoc = gl.getUniformLocation(program, 'u_mapTexture');
      gl.uniform1i(uMapTextureLoc, 0);

      const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
      gl.uniform2f(uResolutionLoc, renderW, renderH);

      // Calcul du cadre 2:1 centré (en coordonnées physiques du canevas pour gl_FragCoord)
      const padding = 28 * dpr;
      const maxW = renderW - padding * 2;
      const maxH = renderH - padding * 2;
      let boxW = maxW;
      let boxH = boxW / 2;
      if (boxH > maxH) {
        boxH = maxH;
        boxW = boxH * 2;
      }

      const cx = renderW / 2;
      const cy = renderH / 2;
      const halfW = boxW / 2;
      const halfH = boxH / 2;

      const uAspectBoxLoc = gl.getUniformLocation(program, 'u_aspectBox');
      gl.uniform4f(uAspectBoxLoc, cx, cy, halfW, halfH);

      // Calcul des limites UV du monde dans mapCanvas
      let uMin = 0.0;
      let vMin = 0.0;
      let uMax = 1.0;
      let vMax = 1.0;

      try {
        const cssW_map = mapCanvas.clientWidth || cssW;
        const cssH_map = mapCanvas.clientHeight || cssH;

        const pTopLeft = activeMap.project([-180, 85.05112878]);
        const pBottomRight = activeMap.project([180, -85.05112878]);
        if (cssW_map > 0 && cssH_map > 0) {
          uMin = pTopLeft.x / cssW_map;
          vMin = pTopLeft.y / cssH_map;
          uMax = pBottomRight.x / cssW_map;
          vMax = pBottomRight.y / cssH_map;
        }
      } catch (_) {}

      const uWorldBoundsLoc = gl.getUniformLocation(program, 'u_worldBounds');
      gl.uniform4f(uWorldBoundsLoc, uMin, vMin, uMax, vMax);

      const uTransformLoc = gl.getUniformLocation(program, 'u_transform');
      gl.uniform3f(uTransformLoc, currentTransform.panX * dpr, currentTransform.panY * dpr, currentTransform.zoom);

      gl.clearColor(0.027, 0.043, 0.078, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    doRenderRef.current = doRender;

    const scheduleRender = () => {
      if (isRenderingRef.current) return;
      isRenderingRef.current = true;
      animFrameRef.current = requestAnimationFrame(doRender);
    };

    if (!programRef.current || !glRef.current || glRef.current.isContextLost()) {
      setupWebGL();
    } else {
      scheduleRender();
    }

    if (map) {
      map.on('render', scheduleRender);
      map.on('move', scheduleRender);
      map.on('resize', scheduleRender);
      map.on('styledata', scheduleRender);
      map.on('idle', scheduleRender);
    }

    const handleWindowResize = () => scheduleRender();
    window.addEventListener('resize', handleWindowResize);

    const timer1 = setTimeout(scheduleRender, 80);
    const timer2 = setTimeout(scheduleRender, 300);
    const timer3 = setTimeout(scheduleRender, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleWindowResize);

      if (map) {
        map.off('render', scheduleRender);
        map.off('move', scheduleRender);
        map.off('resize', scheduleRender);
        map.off('styledata', scheduleRender);
        map.off('idle', scheduleRender);
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [visible]);

  const lodDebounceRef = useRef<any>(null);

  const syncMapLOD = () => {
    const activeMap = mapService.getMap();
    const targetCanvas = canvasRef.current;
    if (!activeMap || !targetCanvas) return;

    const w = targetCanvas.clientWidth || window.innerWidth;
    const h = targetCanvas.clientHeight || window.innerHeight;
    const padding = 28;
    const maxW = w - padding * 2;
    const maxH = h - padding * 2;
    let boxW = maxW;
    let boxH = boxW / 2;
    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * 2;
    }

    const activeCanvas = activeMap.getCanvas();
    const mapW = activeCanvas?.clientWidth || w;
    const mapH = activeCanvas?.clientHeight || h;
    const minDim = Math.min(mapW, mapH);
    const fitWorldSize = Math.max(256, minDim * 0.94);
    const targetZoom = Math.max(0, Math.log2(fitWorldSize / 512));

    if (currentTransform.zoom <= 1.08 && Math.abs(currentTransform.panX) < 6 && Math.abs(currentTransform.panY) < 6) {
      // Vue globale : restaurer le cadrage global sans rognage polaire
      activeMap.jumpTo({
        center: [0, 0],
        zoom: targetZoom,
        pitch: 0,
        bearing: 0
      });
      return;
    }

    // Vue zoomée : calculer le centre géographique exact de la vue actuelle
    const halfW = boxW / 2;
    const halfH = boxH / 2;
    const posInBoxX = -currentTransform.panX / currentTransform.zoom;
    const posInBoxY = -currentTransform.panY / currentTransform.zoom;
    const normX = Math.max(-0.95, Math.min(0.95, posInBoxX / halfW));
    const normY = Math.max(-0.95, Math.min(0.95, -posInBoxY / halfH));

    const geoCenter = eckertIVPixelToGeo(
      { x: (normX + 1) * halfW, y: (1 - normY) * halfH },
      { width: boxW, height: boxH }
    );

    // Zoom dynamique de la caméra Mercator pour charger les tuiles emboîtées (LOD)
    const lodZoom = Math.min(12, targetZoom + Math.log2(currentTransform.zoom));

    try {
      activeMap.jumpTo({
        center: [geoCenter.lon, Math.max(-80, Math.min(80, geoCenter.lat))],
        zoom: lodZoom,
        pitch: 0,
        bearing: 0
      });
    } catch (_) {}
  };

  useEffect(() => {
    if (!visible) return;
    if (doRenderRef.current && !isRenderingRef.current) {
      isRenderingRef.current = true;
      animFrameRef.current = requestAnimationFrame(doRenderRef.current);
    }

    if (lodDebounceRef.current) {
      clearTimeout(lodDebounceRef.current);
    }
    lodDebounceRef.current = setTimeout(() => {
      syncMapLOD();
    }, 140);

    return () => {
      if (lodDebounceRef.current) {
        clearTimeout(lodDebounceRef.current);
      }
    };
  }, [visible, currentTransform.zoom, currentTransform.panX, currentTransform.panY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    const cur = currentTransformRef.current;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: cur.panX,
      panY: cur.panY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dragStart = dragStartRef.current;
    if (!isDraggingRef.current || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const targetPanX = dragStart.panX + dx;
    const targetPanY = dragStart.panY + dy;
    updateTransform(prev => ({
      ...prev,
      panX: targetPanX,
      panY: targetPanY
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getGeoAtScreenPos = (clientX: number, clientY: number): { lon: number; lat: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { lon: 0, lat: 20 };

    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const padding = 28;
    const maxW = rect.width - padding * 2;
    const maxH = rect.height - padding * 2;
    let boxW = maxW;
    let boxH = boxW / 2;
    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * 2;
    }

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const halfW = boxW / 2;
    const halfH = boxH / 2;

    const cur = currentTransformRef.current;
    const normX = (clickX - cx - cur.panX) / (halfW * Math.max(0.001, cur.zoom));
    const normY = (cy + cur.panY - clickY) / (halfH * Math.max(0.001, cur.zoom));

    const clampedNormX = Math.max(-0.98, Math.min(0.98, normX));
    const clampedNormY = Math.max(-0.98, Math.min(0.98, normY));

    const geo = eckertIVPixelToGeo(
      { x: (clampedNormX + 1) * halfW, y: (1 - clampedNormY) * halfH },
      { width: boxW, height: boxH }
    );

    return {
      lon: isNaN(geo.lon) ? 0 : Math.max(-180, Math.min(180, geo.lon)),
      lat: isNaN(geo.lat) ? 20 : Math.max(-80, Math.min(80, geo.lat))
    };
  };

  // Écouteur de molette natif avec { passive: false } pour permettre e.preventDefault() sans avertissement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const cur = currentTransformRef.current;
      const transToGlobe = onTransitionToGlobeRef.current;

      // Si l'utilisateur zoome en profondeur au-delà du planisphère (zoom >= 2.4), bascule fluide vers le Globe 3D
      if (e.deltaY < 0 && cur.zoom >= 2.4 && transToGlobe) {
        const geo = getGeoAtScreenPos(e.clientX, e.clientY);
        transToGlobe(geo, { x: e.clientX, y: e.clientY });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const zoomFactor = e.deltaY < 0 ? 1.18 : 1 / 1.18;

      updateTransform(prev => {
        const newZoom = Math.max(1.0, Math.min(15.0, prev.zoom * zoomFactor));
        if (newZoom === prev.zoom) return prev;

        if (newZoom <= 1.001) {
          return { zoom: 1.0, panX: 0, panY: 0 };
        }

        const scaleChange = newZoom / prev.zoom;
        const newPanX = mouseX - (mouseX - prev.panX) * scaleChange;
        const newPanY = mouseY - (mouseY - prev.panY) * scaleChange;

        return {
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY
        };
      });
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [visible, updateTransform]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cur = currentTransformRef.current;
    const transToGlobe = onTransitionToGlobeRef.current;

    // Double-clic : si déjà zoomé (>= 1.8), plonger dans le Globe 3D ; sinon zoomer localement à 2.2
    if (cur.zoom >= 1.8 && transToGlobe) {
      const geo = getGeoAtScreenPos(e.clientX, e.clientY);
      transToGlobe(geo, { x: e.clientX, y: e.clientY });
      return;
    }

    if (cur.zoom > 1.05 || Math.abs(cur.panX) > 1 || Math.abs(cur.panY) > 1) {
      updateTransform({ zoom: 1.0, panX: 0, panY: 0 });
    } else {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const newZoom = 2.2;
      const scaleChange = newZoom / 1.0;
      updateTransform({
        zoom: newZoom,
        panX: mouseX - mouseX * scaleChange,
        panY: mouseY - mouseY * scaleChange
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const cur = currentTransformRef.current;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        dist: 0,
        panX: cur.panX,
        panY: cur.panY,
        zoom: cur.zoom
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchStartRef.current = {
        x: midX,
        y: midY,
        dist,
        panX: cur.panX,
        panY: cur.panY,
        zoom: cur.zoom
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchStart = touchStartRef.current;
    if (!touchStart) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      const targetPanX = touchStart.panX + dx;
      const targetPanY = touchStart.panY + dy;
      updateTransform(prev => ({
        ...prev,
        panX: targetPanX,
        panY: targetPanY
      }));
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (touchStart.dist > 0) {
        const scale = dist / touchStart.dist;
        if (scale > 1.12 && onTransitionToGlobeRef.current) {
          const midX = (t1.clientX + t2.clientX) / 2;
          const midY = (t1.clientY + t2.clientY) / 2;
          const geo = getGeoAtScreenPos(midX, midY);
          onTransitionToGlobeRef.current(geo, { x: midX, y: midY });
          return;
        }
        const targetZoom = Math.max(1.0, Math.min(15.0, touchStart.zoom * scale));
        updateTransform(prev => ({
          ...prev,
          zoom: targetZoom
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // Au-dessus du mapContainer (z=0) et sous EckertIVOverlay (z=5)
        pointerEvents: visible ? 'auto' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
    />
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
}

class EckertIVErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('[EckertIVWarpCanvas] Erreur interceptée par ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const EckertIVWarpCanvas: React.FC<EckertIVWarpCanvasProps> = (props) => {
  return (
    <EckertIVErrorBoundary>
      <EckertIVWarpCanvasInternal {...props} />
    </EckertIVErrorBoundary>
  );
};

import { FeatureCollection, Geometry } from 'geojson';

/**
 * Lit un fichier image (PNG/JPEG) localement et en extrait les contours sombres
 * sous forme d'une collection d'entités géométriques GeoJSON (Polygones ou Lignes).
 * 
 * @param file Le fichier image téléversé.
 * @param threshold Seuil de luminance (0-255) en dessous duquel un pixel est considéré comme dessiné.
 * @returns Une FeatureCollection GeoJSON contenant les contours détectés.
 */
export async function parseSketchImage(file: File, threshold: number = 100): Promise<FeatureCollection<Geometry>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const width = 1024;
          const height = 512;
          
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Impossible d\'obtenir le contexte 2D pour le traitement d\'image');
          }
          
          // Dessiner l'image en adaptant l'échelle
          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          // 1. Seuillage de luminance : 1 = sombre (tracé), 0 = clair (fond)
          const grid = new Uint8Array(width * height);
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const isDark = a > 50 && luminance < threshold;
            grid[i / 4] = isDark ? 1 : 0;
          }
          
          // 2. Regroupement par composantes connexes (parcours en largeur BFS)
          const visited = new Uint8Array(width * height);
          const features: any[] = [];
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              if (grid[idx] === 1 && !visited[idx]) {
                // Nouvelle entité détectée : collecter tous ses pixels
                const coords: [number, number][] = [];
                const queue: [number, number][] = [[x, y]];
                visited[idx] = 1;
                
                while (queue.length > 0) {
                  const curr = queue.shift()!;
                  const [cx, cy] = curr;
                  
                  // Transformer les pixels en coordonnées géographiques mondiales
                  const lon = (cx / width) * 360 - 180;
                  const lat = 90 - (cy / height) * 180;
                  coords.push([lon, lat]);
                  
                  // 4-connectivité
                  const neighbors = [
                    [cx + 1, cy],
                    [cx - 1, cy],
                    [cx, cy + 1],
                    [cx, cy - 1]
                  ];
                  
                  for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                      const nIdx = ny * width + nx;
                      if (grid[nIdx] === 1 && !visited[nIdx]) {
                        visited[nIdx] = 1;
                        queue.push([nx, ny]);
                      }
                    }
                  }
                }
                
                // Si la composante est assez grande (pour éviter le bruit de fond)
                if (coords.length > 10) {
                  // Simplification de tracé basique : garder 1 point sur 6 pour ne pas surcharger MapLibre
                  const simplifiedCoords: [number, number][] = [];
                  for (let i = 0; i < coords.length; i += 6) {
                    simplifiedCoords.push(coords[i]);
                  }
                  
                  // Pour un polygone valide en GeoJSON, il faut fermer la ligne si elle est connectée
                  if (simplifiedCoords.length > 2) {
                    simplifiedCoords.push(simplifiedCoords[0]); // fermer le tracé
                    
                    features.push({
                      type: 'Feature',
                      id: crypto.randomUUID(),
                      properties: {
                        name: `Contour Croquis ${features.length + 1}`,
                        type: 'continent',
                        confidence: 0.85
                      },
                      geometry: {
                        type: 'Polygon',
                        coordinates: [simplifiedCoords]
                      }
                    });
                  }
                }
              }
            }
          }
          
          resolve({
            type: 'FeatureCollection',
            features
          });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image du croquis'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image'));
    reader.readAsDataURL(file);
  });
}

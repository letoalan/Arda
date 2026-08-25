// braudel/src/services/vision/preprocess.ts
declare const cv: any;

/**
 * Prétraite une image (croquis) en utilisant OpenCV.js
 * Applique une détection de contours (Canny) et une fermeture morphologique.
 * Exporte le résultat en JPEG qualité 85 pour limiter le poids réseau.
 */
export async function preprocessSketchImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        try {
          // Vérifier si OpenCV est prêt
          if (typeof cv === 'undefined' || !cv.Mat) {
            throw new Error("OpenCV.js n'est pas encore initialisé. Veuillez patienter.");
          }

          // Redimensionner l'image si elle est trop grande (max 1024px)
          const MAX_SIZE = 1024;
          let width = imgElement.width;
          let height = imgElement.height;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          const resizedCanvas = document.createElement('canvas');
          resizedCanvas.width = width;
          resizedCanvas.height = height;
          const ctx = resizedCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgElement, 0, 0, width, height);
          }

          // Charger l'image redimensionnée dans une matrice OpenCV
          const src = cv.imread(resizedCanvas);
          const gray = new cv.Mat();
          
          // Conversion en niveaux de gris
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          // Détection de contours (Canny Edge Detection)
          const edges = new cv.Mat();
          cv.Canny(gray, edges, 50, 150, 3, false);

          // Fermeture morphologique pour lier les traits cassés (Dilate puis Erode)
          const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
          const dilated = new cv.Mat();
          cv.dilate(edges, dilated, kernel);
          
          const closed = new cv.Mat();
          cv.erode(dilated, closed, kernel);

          // Inverser les couleurs pour obtenir des traits noirs sur fond blanc
          const inverted = new cv.Mat();
          cv.bitwise_not(closed, inverted);

          // Dessiner le résultat sur un canvas hors-écran
          const outCanvas = document.createElement('canvas');
          cv.imshow(outCanvas, inverted);

          // Exporter en JPEG base64 avec qualité 85%
          const base64 = outCanvas.toDataURL('image/jpeg', 0.85);

          // Nettoyage de la mémoire OpenCV
          src.delete();
          gray.delete();
          edges.delete();
          kernel.delete();
          dilated.delete();
          closed.delete();
          inverted.delete();

          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      imgElement.onerror = () => reject(new Error("Erreur lors du chargement de l'image."));
      imgElement.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier image."));
    reader.readAsDataURL(file);
  });
}

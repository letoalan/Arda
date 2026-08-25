# Plan d'implémentation — Pipeline de reconnaissance de relief v2 (Braudel/Arda)

## Contexte
Remplacement du pipeline aveugle actuel (BFS / Marching Squares / Potrace + LLM texte seul)
par une chaîne hybride : Nemotron Nano VL (guidage + nommage sémantique) + SAM2/SAM3.1
(segmentation pixel-précise) + Potrace (vectorisation finale), déployée en serverless.

---

## Phase 0 — Préparation (0.5 jour)
- [ ] Créer une branche `feature/vision-pipeline-v2`
- [ ] Ajouter les clés API dans `.env` : `NVIDIA_NIM_API_KEY`, `SEGMIND_API_KEY` (ou `FAL_API_KEY`)
- [ ] Créer le dossier `src/services/vision/` pour isoler la nouvelle logique
- [ ] Ajouter un flag de config `VISION_PIPELINE_VERSION=v2` pour permettre un rollback rapide vers l'ancien pipeline

---

## Phase 1 — Nettoyage image côté client (1 jour)
Fichier : `src/services/vision/preprocess.ts`
- [ ] Intégrer `opencv.js` (WASM) déjà évoqué en Piste 1 de l'audit
- [ ] Implémenter Canny Edge Detection + fermeture morphologique (dilate/erode) sur l'image importée
- [ ] Exporter l'image nettoyée en base64 JPEG qualité 85 (réduire poids réseau)
- [ ] Tests : vérifier sur 3 croquis bruités + la carte Rhûn/Palisor fournie

---

## Phase 2 — Endpoint serverless "guide" (Nemotron VL) (1.5 jour)
Fichier : `../../api/vision/guide.ts` (fonction serverless, ex: Vercel/Cloudflare Worker)
- [ ] Créer un client OpenAI-compatible pointant vers NVIDIA NIM (`https://integrate.api.nvidia.com/v1`)
- [ ] Modèle cible : `nvidia/nvidia-nemotron-nano-12b-v2-vl`
- [ ] Input : image base64 nettoyée (Phase 1) + prompt structuré (voir ci-dessous)
- [ ] Output attendu (forcer un JSON strict) :
```json
{
  "regions": [
    {"label": "continent", "bbox": [120, 80, 400, 300], "hint_point": [260, 190]},
    {"label": "legende", "bbox": [10, 10, 100, 60], "ignore": true}
  ]
}
```
- [ ] Prompt système : "Tu analyses un croquis de carte imaginaire. Renvoie UNIQUEMENT un JSON listant les régions distinctes (continents, îles, mers intérieures) avec leur bounding box approximative en pixels et un point représentatif à l'intérieur. Ignore toute légende ou texte."
- [ ] Gérer le mode `/think` si besoin de raisonnement plus poussé sur cartes complexes
- [ ] Fallback : si le JSON est invalide, retry une fois avec un prompt simplifié, puis erreur explicite au front

---

## Phase 3 — Endpoint serverless "segmentation" (SAM2/SAM3.1) (1.5 jour)
Fichier : `../../api/vision/segment.ts`
- [ ] Choisir le provider : Segmind (`sam-v2-image`) ou fal.ai (`sam2/image`) — comparer cold start réel en Phase 6
- [ ] Pour chaque région retournée par Nemotron (hors `ignore: true`), appeler SAM avec le `hint_point`
- [ ] Récupérer le masque (PNG alpha ou polygone direct selon provider)
- [ ] Paralléliser les appels SAM par région (Promise.all) pour limiter la latence totale
- [ ] Stocker temporairement les masques (buffer mémoire, pas de disque en serverless)

---

## Phase 4 — Vectorisation finale (1 jour)
Fichier : `src/services/vision/vectorize.ts`
- [ ] Réutiliser `potraceStrategy.ts` existant, mais l'appliquer désormais sur le masque binaire SAM (propre) au lieu du croquis brut
- [ ] Ajuster `turdsize` et `alphamax` : les masques SAM étant déjà nets, réduire le lissage excessif
- [ ] Convertir chaque contour Potrace en GeoJSON (`Polygon` ou `MultiPolygon` pour gérer les mers intérieures/trous)

---

## Phase 5 — Qualification sémantique finale (0.5 jour)
Fichier : `../../api/vision/label.ts` (peut réutiliser le même client Nemotron de la Phase 2)
- [ ] Envoyer à Nemotron : l'image originale + les polygones GeoJSON générés + la consigne utilisateur ("dessine un archipel")
- [ ] Récupérer un nom + type (`continent`, `ile`, `mer_interieure`, `chaine_montagneuse`) par polygone
- [ ] Fusionner ces métadonnées dans le modèle de données existant (`ai-service.ts`)

---

## Phase 6 — Orchestration & bench serverless (1 jour)
Fichier : `api/vision/pipeline.ts` (point d'entrée unique appelé par le front)
- [ ] Enchaîner Phase 1 (déjà côté client) → Phase 2 → Phase 3 (parallèle par région) → Phase 4 → Phase 5
- [ ] Ajouter un timeout global (ex: 20s) avec fallback vers l'ancien pipeline BFS si dépassement
- [ ] Logger la latence de chaque étape (Nemotron, SAM, Potrace) pour identifier le goulot d'étranglement réel
- [ ] Comparer Segmind vs fal.ai vs Modal sur : cold start, coût par appel, stabilité sous charge

---

## Phase 7 — Intégration front & UX (1 jour)
- [ ] Adapter le composant d'import de croquis pour afficher un loader multi-étapes ("Analyse IA…", "Segmentation…", "Vectorisation…")
- [ ] Permettre à l'utilisateur de cliquer manuellement un point si Nemotron a raté une région (fallback interactif vers SAM direct)
- [ ] Afficher les polygones GeoJSON générés sur la carte MapLibre/Leaflet existante pour validation visuelle immédiate

---

## Phase 8 — Tests & rollback (0.5 jour)
- [ ] Jeu de test : croquis crayonné simple, carte texturée type Tolkien, carte avec mers intérieures et hachures
- [ ] Comparer qualité vs ancien pipeline (BFS/Marching Squares/Potrace seul)
- [ ] Garder le flag `VISION_PIPELINE_VERSION` pour rollback instantané en cas de régression en prod

---

## Récapitulatif des fichiers à créer/modifier
| Fichier | Action |
|---|---|
| `src/services/vision/preprocess.ts` | Créer (OpenCV.js) |
| `../../api/vision/guide.ts` | Créer (Nemotron VL) |
| `../../api/vision/segment.ts` | Créer (SAM2/SAM3.1) |
| `src/services/vision/vectorize.ts` | Créer (Potrace sur masque) |
| `../../api/vision/label.ts` | Créer (Nemotron qualification) |
| `api/vision/pipeline.ts` | Créer (orchestrateur) |
| `ai-service.ts` | Modifier (retirer l'appel LLM aveugle, brancher sur `pipeline.ts`) |
| `sketch-parser.ts` / `contourStrategy.ts` | Conserver en fallback uniquement (`VISION_PIPELINE_VERSION=v1`) |

## Estimation totale
~8.5 jours-homme, séquençable en 2 sprints d'une semaine.

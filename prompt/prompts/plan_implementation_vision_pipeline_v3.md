# Plan d'implémentation v3 — Pipeline de reconnaissance de relief (Braudel/Arda)
## Architecture hybride : Nemotron via LM Studio local + SAM en serverless

## Contexte
Version révisée du plan v2 : la partie raisonnement/nommage (Nemotron) est déportée sur
un serveur LM Studio local géré par l'utilisateur (protocole OpenAI-compatible), tandis que
la segmentation pixel-précise (SAM2/SAM3.1) reste en serverless distant, LM Studio ne
supportant pas la segmentation d'image. Le front reste hébergé sur GitHub Pages.

---

## Phase 0 — Configuration utilisateur & préparation (1 jour)
Fichier : `src/settings/LmStudioConfig.tsx` + `src/services/vision/lmStudioClient.ts`
- [ ] Ajouter un écran de configuration avec 2 champs :
  - `lmStudioBaseUrl` (ex: http://localhost:1234/v1)
  - `lmStudioModelName` (récupéré via GET /v1/models, menu déroulant)
- [ ] Bouton "Tester la connexion" → appelle GET {baseUrl}/models, affiche succès/échec
- [ ] Stocker la config en localStorage (pas de secret à protéger ici, tout est local)
- [ ] Documentation utilisateur : activer CORS + "Serve on Local Network" dans
      LM Studio > Developer > Server Settings si besoin
- [ ] Gérer l'avertissement "mixed content" HTTPS (front) / HTTP (localhost) :
      message d'aide affiché si le fetch échoue (autoriser contenu non sécurisé pour ce site)
- [ ] Ajouter clé API Segmind ou fal.ai (.env) pour la partie SAM distante
- [ ] Flag de config `VISION_PIPELINE_VERSION=v3` pour rollback vers pipeline v1

---

## Phase 1 — Nettoyage image côté client (1 jour)
Fichier : `src/services/vision/preprocess.ts`
- [ ] Intégrer opencv.js (WASM), Canny Edge Detection + dilatation/érosion
- [ ] Export image nettoyée en base64 JPEG qualité 85
- [ ] Tests sur croquis bruités + carte Rhûn/Palisor de référence

---

## Phase 2 — Client Nemotron local (OpenAI-compatible) (1.5 jour)
Fichier : `src/services/vision/lmStudioClient.ts`
- [ ] Créer un client HTTP générique réutilisant fetch (pas de SDK OpenAI nécessaire côté navigateur)
- [ ] Fonction `guideRegions(imageBase64, userPrompt)` :
      POST {baseUrl}/chat/completions
      body: { model: lmStudioModelName, messages: [...], max_tokens: 512 }
- [ ] Vérifier que le modèle chargé supporte la vision (mmproj) ; si modèle texte seul détecté,
      afficher un avertissement "ce modèle ne peut pas analyser l'image, chargez un VLM (ex: Qwen2-VL, LLaVA)"
- [ ] Prompt structuré forçant une sortie JSON stricte :
```json
{
  "regions": [
    {"label": "continent", "bbox": [120,80,400,300], "hint_point": [260,190]},
    {"label": "legende", "bbox": [10,10,100,60], "ignore": true}
  ]
}
```
- [ ] Parser défensif : si JSON invalide, retry une fois avec prompt simplifié, sinon fallback manuel (Phase 7)

---

## Phase 3 — Endpoint serverless "segmentation" (SAM2/SAM3.1) (1.5 jour)
Fichier : `../../api/vision/segment.ts` (Cloudflare Worker, séparé du front GitHub Pages)
- [ ] Choisir provider : Segmind (sam-v2-image) ou fal.ai (sam2/image)
- [ ] Pour chaque région non ignorée, appeler SAM avec le hint_point fourni par Nemotron local
- [ ] Paralléliser les appels (Promise.all)
- [ ] Retourner les masques au front (le Worker sert de proxy sécurisé pour la clé API SAM)
- [ ] Configurer CORS du Worker pour n'autoriser que le domaine *.github.io

---

## Phase 4 — Vectorisation finale (1 jour)
Fichier : `src/services/vision/vectorize.ts`
- [ ] Appliquer potraceStrategy.ts existant sur les masques SAM (au lieu du croquis brut)
- [ ] Ajuster turdsize/alphamax (masques déjà propres, réduire lissage)
- [ ] Générer GeoJSON Polygon/MultiPolygon (gestion des trous / mers intérieures)

---

## Phase 5 — Qualification sémantique finale (0.5 jour)
Fichier : `src/services/vision/lmStudioClient.ts` (fonction `labelPolygons`)
- [ ] Réutiliser le même client Nemotron local (Phase 2)
- [ ] Envoyer image originale + GeoJSON généré + consigne utilisateur
- [ ] Récupérer nom + type (continent, ile, mer_interieure, chaine_montagneuse) par polygone
- [ ] Fusionner dans le modèle de données existant (ai-service.ts)

---

## Phase 6 — Orchestration & mode dégradé (1 jour)
Fichier : `src/services/vision/pipeline.ts`
- [ ] Enchaîner : Phase 1 (local) → Phase 2 (LM Studio local) → Phase 3 (Worker distant, parallèle)
      → Phase 4 (local) → Phase 5 (LM Studio local)
- [ ] Timeout par étape : 10s pour LM Studio (peut être lent selon la machine utilisateur),
      15s pour SAM distant
- [ ] Mode dégradé automatique si LM Studio est injoignable :
      basculer sur pipeline v1 (BFS/Potrace) sans guidage IA, avec message explicite à l'utilisateur
- [ ] Logger la latence par étape pour diagnostic (LM Studio dépend du matériel local)

---

## Phase 7 — Intégration front & fallback interactif (1 jour)
- [ ] Loader multi-étapes ("Connexion à LM Studio…", "Analyse locale…", "Segmentation distante…")
- [ ] Si Phase 2 échoue ou renvoie un JSON invalide : permettre à l'utilisateur de cliquer
      manuellement un point sur l'image pour lancer SAM directement (sans guidage IA)
- [ ] Afficher les polygones GeoJSON sur MapLibre/Leaflet pour validation visuelle
- [ ] Bandeau permanent indiquant l'état de connexion LM Studio (connecté / modèle chargé / hors ligne)

---

## Phase 8 — Tests & rollback (0.5 jour)
- [ ] Tester avec LM Studio éteint (mode dégradé v1)
- [ ] Tester avec un modèle texte seul chargé (message d'avertissement vision)
- [ ] Tester avec Nemotron VL ou VLM alternatif (Qwen2-VL/LLaVA) chargé
- [ ] Tester le blocage mixed content HTTPS/HTTP sur différents navigateurs
- [ ] Comparer qualité vs pipeline v1 sur le jeu de cartes de référence
- [ ] Conserver VISION_PIPELINE_VERSION pour rollback instantané

---

## Récapitulatif des fichiers
| Fichier | Action |
|---|---|
| src/settings/LmStudioConfig.tsx | Créer (config + test connexion) |
| src/services/vision/lmStudioClient.ts | Créer (guideRegions, labelPolygons) |
| src/services/vision/preprocess.ts | Créer (OpenCV.js) |
| api/vision/segment.ts (Cloudflare Worker) | Créer (proxy SAM) |
| src/services/vision/vectorize.ts | Créer (Potrace sur masque) |
| src/services/vision/pipeline.ts | Créer (orchestrateur + mode dégradé) |
| ai-service.ts | Modifier (brancher sur pipeline.ts) |
| sketch-parser.ts / contourStrategy.ts | Conserver en fallback v1 |

## Points de vigilance spécifiques LM Studio
- Latence variable selon le matériel de l'utilisateur (pas de SLA, contrairement à un provider cloud)
- Nécessite un modèle vision (mmproj) chargé, pas seulement un LLM texte
- CORS et mixed content HTTPS/HTTP à documenter clairement pour l'utilisateur final
- Pas de segmentation d'image possible via LM Studio : SAM reste obligatoirement distant

## Estimation totale
~8.5 jours-homme, séquençable en 2 sprints d'une semaine.

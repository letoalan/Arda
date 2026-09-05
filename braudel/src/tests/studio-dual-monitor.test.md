# Documentation — Tests Régie Bi-Écran (`studio-dual-monitor.test.ts`)

Suite de tests automatisés Vitest validant le fonctionnement de l'architecture à 2 écrans du Mode Studio (Atelier de cadrage et Moniteur Programme 16:9).

---

## 1. Périmètre des Tests

1. **Résolution du clip actif** :
   - Vérifie que selon la position du playhead (`playheadMs`), le bon type de média est résolu (`map`, `image`, `video`, ou `undefined` lors d'un gap).
2. **Calcul d'offset temporel vidéo** :
   - Valide le calcul mathématique `(playheadMs - startMs + trimStartMs) / 1000` pour asservir la lecture de vidéos externes.
3. **Filtrage temporel pour cartouche cinématique** :
   - Vérifie que seules les entités historiques valides à l'époque de la période (`temporalRange`) sont transmises au cartouche de légende.
4. **Formatage des dates historiques** :
   - Vérifie la conversion élégante des années négatives (`av. J.-C.`) et positives (`An X`).
5. **Mise à jour du cadrage caméra (`onSaveCamera`)** :
   - Valide que l'action d'enregistrement fige les coordonnées exactes sur le clip sélectionné sans contaminer les autres clips.
6. **Isolation des codecs audio (`CODEC_CASCADE_AUDIO`)** :
   - Valide l'exclusion stricte de `codecs=vp8` sur les flux contenant de l'audio pour éviter l'erreur `DOMException: An audio track cannot be recorded`.
7. **Sauvegarde et restauration de projet vidéo** :
   - Vérifie la sérialisation/désérialisation complète de la timeline vidéo dans le stockage et l'export structuré.
8. **Préservation canonique du bearing Al-Idrisi (`getEffectiveStyleBearing`)** :
   - Valide que le style `al_idrisi` renvoie systématiquement 180° lorsque le bearing est non défini ou vaut 0, tout en respectant les angles personnalisés ou les autres styles cartographiques.
9. **Initialisation automatique de la timeline multi-piste (`createDefaultEditTimeline`)** :
   - Vérifie que les scènes Al-Idrisi reçoivent immédiatement le bearing de 180° sur leurs `VideoClip`.
10. **Synchronisation playhead et réinitialisation de caméra sans reset à 0°** :
    - Valide que lors du scrubbing de la tête de lecture ou de la réinitialisation de cadrage pour un plan Al-Idrisi, `jumpTo` est appelé avec `bearing: 180` et ne retombe jamais à `0`.
11. **Détection insensible à la casse et motifs Al-Idrisi (`*idrisi*`)** :
    - Valide la reconnaissance de variantes comme `Al_Idrisi`, `al_idrisi_medieval`, `style-idrisi-historical`.
12. **Garantie du cap 180° Al-Idrisi sur toutes les scènes sans basemapStyle unitaire (`playSceneTransition`)** :
    - Valide que lors de l'exécution d'une transition, le repli vers le style actif de la carte applique systématiquement `bearing: 180` même si la scène n'a pas son propre `basemapStyle` et a un `bearing` à 0.
13. **Garantie 100% des diapositives en orientation Sud (`createDefaultEditTimeline`)** :
    - Vérifie qu'un récit à multiples diapositives sans `bearing` hérite du fallback `al_idrisi` sur 100% des plans.
14. **Standardisation 16:9 Full HD et élimination de l'anamorphose (`resolveTargetVideoDimensions`)** :
    - Vérifie la résolution par défaut à 1920×1080 (16:9 Full HD), ainsi que les formats 9:16 (1080×1920) et 1:1 (1080×1080) avec maintien strict de la sphéricité du globe.
15. **Propagation canonique dans les étapes programmées (`buildScheduledVideoSteps`)** :
    - Vérifie que chaque étape de capture programmée possède son `bearing: 180` et son `basemapStyle`.

---

## 2. Dépendances

- `vitest` : Framework de test.
- `TimelineScheduler.ts` : `getVideoClipAtTime`.
- `studio-types.ts` : `EditTimeline`, `VideoClip`.
- `entity.ts` : Schéma d'entités géographiques.

---

## 3. Fil d'Ariane

[tests/](./tests.md) -> **studio-dual-monitor.test.md**

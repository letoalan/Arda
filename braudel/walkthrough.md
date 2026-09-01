# Walkthrough — Résolution de l'Erreur `unsupported codec` dans l'Export Vidéo

## Diagnostic
Lors du déclenchement de l'export vidéo WebM, le navigateur a levé l'exception :
```
DOMException: MediaRecorder constructor: video/webm;codecs=vp9 indicates an unsupported codec
at exportStoryToWebM (video-export.ts:23)
```
- Le codec `video/webm;codecs=vp9` était codé en dur sans vérification préalable de la prise en charge matérielle/logicielle du navigateur client (`MediaRecorder.isTypeSupported`).
- Sur certains environnements (comme Firefox sous Windows ou configurations sans accélération VP9), cette chaîne stricte est rejetée par le constructeur.

---

## Solutions Appliquées

### 1. Négociation Dynamique des Codecs ([`video-export.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/video-export.ts#L7-L35))
- Implémentation de `getSupportedVideoMimeType()` testant en cascade les codecs :
  1. `video/webm;codecs=vp9,opus`
  2. `video/webm;codecs=vp9`
  3. `video/webm;codecs=vp8,opus`
  4. `video/webm;codecs=vp8`
  5. `video/webm;codecs=h264`
  6. `video/webm`
  7. `video/mp4;codecs=h264`
  8. `video/mp4`
- Si un format spécifique est accepté, il est transmis à `MediaRecorder`.
- Si le constructeur échoue malgré tout, un bloc `try/catch` applique un **repli de sécurité ultime** en instanciant `new MediaRecorder(stream)` sans options pour laisser le navigateur utiliser son codec par défaut sans jamais lever d'exception bloquante.

### 2. Détection d'Extension Automatique
- Le nom du fichier téléchargé adapte son extension (`.webm` ou `.mp4`) en fonction du codec effectif retenu par `MediaRecorder.mimeType`.

### 3. Synchronisation Caméra & Époques dans `handleWebmExport` ([`DataPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/DataPanel.tsx#L326-L375))
- Si aucune scène personnalisée n'est configurée, l'export vidéo parcourt automatiquement les époques actives du monde avec conservation de l'orientation (**Al-Idrisi `bearing: 180°`**) et pauses pédagogiques de 1,2 seconde.

---

## Validation
- **TypeScript** : 0 erreur (`tsc --noEmit`).
- **Tests unitaires** : 28 fichiers de tests, **164/164 tests passants (100%)**.
- **Wiki-as-Code** : [`video.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/video.md) mis à jour.

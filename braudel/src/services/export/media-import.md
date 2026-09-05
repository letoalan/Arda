# Documentation — Importation de Médias Externes (`media-import.ts`)

Ce module gère l'importation de fichiers multimédias externes (images PNG, JPEG, WebP, SVG et vidéos MP4, WebM) pour leur insertion directe en tant que clips sur la timeline du Mode Studio.

---

## 1. Fonctions Principales

| Fonction | Rôle |
|:---|:---|
| `isMediaFile(file)` | Détecte si le fichier sélectionné est une image ou une vidéo MIME compatible |
| `extractVideoDuration(file)` | Lit la métadonnée temporelle d'un conteneur vidéo via un élément `<video>` hors-champ |
| `readFileAsDataUrl(file)` | Lit le fichier local en base64 Data URL |
| `importMediaFile(file, startMs, defaultDurationMs)` | Crée un `VideoClip` typé (`mediaType: 'image' \| 'video'`) avec durées et offsets de trim initialisés |

---

## 2. Intégration dans la Timeline

Les clips créés disposent de :
- `mediaType` : `'image'` ou `'video'`.
- `mediaUrl` : chaîne Data URL persistant le média.
- `sourceDurationMs` : durée originale pour le calcul non destructif des crops temporels.
- `trimStartMs` et `trimEndMs` : offsets de rognage in/out.

---

## 3. Fil d'Ariane

[services/](../services.md) -> [export/](./export.md) -> **media-import.md**

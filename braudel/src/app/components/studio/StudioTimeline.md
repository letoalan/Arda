# Documentation — Éditeur Studio Timeline (`StudioTimeline.tsx`)

Composant IHM principal du **Mode Studio** (inspiré de CapCut), permettant de manipuler visuellement la timeline temporelle des périodes, d'en étendre les durées, d'y intercaler des pistes vidéo et de synchroniser des pistes audio (musique et voix off) avant l'export vidéo final.

---

## 1. Fonctionnalités et Organisation Visuelle (Régie à 2 Écrans Horizontaux)

Le composant est rendu directement sur `document.body` via un **React Portal** (`createPortal`), éliminant tout conflit de bloc conteneur CSS avec la barre latérale.

### Barre Flottante Supérieure (HUD de Régie)
- **Bouton Croix de Fermeture (X)** : quitte instantanément le Studio et restaure la vue standard.
- **Raccourci Clavier Échap** : écouteur global déclenchant immédiatement la fermeture.
- **Timecode dynamique** : affichage en direct de la position courante du playhead et de la durée totale (`00:04.2 / 00:24.0`).
- **Commandes de transport** : boutons Lecture/Pause (`Play`/`Pause`) animant la carte en direct, et Retour au début (`RotateCcw`).
- **Zoom temporel** : slider et boutons de zoom (+ / -) ajustant l'échelle temporelle horizontale de 20 px/sec à 150 px/sec.
- **Bascule Agencement 2 Écrans / 1 Écran** : bouton `[⬛⬛ 2 Écrans]` / `[⬛ 1 Écran]` pour adapter l'affichage aux configurations mono-moniteur ou plein format.
- **Sauvegarde du Projet Vidéo (`[💾 Sauvegarder Projet]` / `Ctrl+S`)** : enregistre instantanément l'intégralité de la timeline (clips, cadrages caméra, médias, découpes, pistes audio) dans le stockage local persistant et notifie l'utilisateur par toast.
- **Export & Import Fichier Projet JSON (`[📥 Export JSON]` & `[📂 Ouvrir JSON]`)** : permet d'exporter une archive `.json` complète du projet pour archivage externe et de réimporter à tout moment un montage existant.
- **Importation Médias Externes** : bouton `[🖼️ Importer Média]` supportant images et vidéos.
- **Importation Audio** : bouton `[🎵 Audio]` pour fichiers MP3/WAV/OGG avec décodage Web Audio et extraction de forme d'onde.
- **Bouton Générer Vidéo** : transmet le plan de montage `EditTimeline` au pipeline d'export enrichi.

- **Préservation de l'Orientation Historique Al-Idrisi (180° Sud en haut)** : À l'ouverture du mode Studio ainsi que lors du scrubbing de la tête de lecture (`syncMapToPlayhead`) ou de la réinitialisation de cadrage (`handleResetClipCamera`), le cap historique de 180° propre à la carte islamique médiévale Al-Idrisi est systématiquement garanti via `getEffectiveStyleBearing`, évitant toute réinitialisation intempestive au Nord (0°).
- **Zone Centrale : 2 Écrans Horizontaux (Régie Bi-Écran)**
1. **Écran 1 (Gauche) — Atelier de Cadrage & Source ([`StudioWorkspaceMonitor.tsx`](./StudioWorkspaceMonitor.md))** :
   - Instance MapLibre pleinement interactive (pan, zoom, rotation, pitch).
   - Bouton **`[🎯 Enregistrer Cadrage]`** pour figer la vue actuelle dans le `mapState` du clip sélectionné.
   - Bouton **`[🔄 Réinit]`** pour restaurer le cadrage mémorisé d'origine.
   - Inspecteur des médias sources pour images et vidéos importées.
2. **Écran 2 (Droite) — Moniteur Programme WYSIWYG ([`StudioProgramMonitor.tsx`](./StudioProgramMonitor.md))** :
   - Rendu fidèle au ratio 16:9 reproduisant le résultat exact du flux d'export vidéo.
   - Relais dynamique temps réel de la carte, affichage centré des images, lecture asservie des vidéos externes.
   - **Cartouche Cinématique WYSIWYG** incrusté avec titre de période, année historique formatée, numéro de plan et entités géographiques actives (avec bascule `ON/OFF`).
   - Guides et repères de sécurité 16:9 (`Safe Zones` Action/Title).

### Dock Inférieur Pleine Largeur (Console de Montage)
- **Barre d'Outils de Montage Intégrée** :
  - `[✂️ Scinder (S)]` : scinde le clip sélectionné ou le clip sous le playhead en deux segments contigus.
  - `[📋 Copier (Ctrl+C)]` : place le clip sélectionné dans le presse-papiers Studio.
  - `[✂️ Couper (Ctrl+X)]` : copie et retire le clip de la timeline avec auto-résolution des collisions.
  - `[📥 Coller (Ctrl+V)]` : colle l'élément du presse-papiers au niveau de la tête de lecture.
  - `[🗑️ Supprimer (Suppr)]` : supprime l'élément sélectionné.
  - **Notifications Toast** : confirmation visuelle en temps réel des actions de montage.
- **Crops Temporels Universels (In / Out Trimming)** :
  - Poignées gauche (Crop In / `trimStartMs`) et droite (Crop Out / `trimEndMs`) étirables à la souris sur tous les clips (vidéos, cartes, audios).
  - Badge dynamique affichant les offsets temporels (`Crop: In +X.Xs / Out -Y.Ys`).
- **Piste Vidéo Multi-Médias** :
  - Différenciation visuelle par type de média : cartes en violet (`#c084fc`), images en cyan (`#38bdf8`) avec miniature, vidéos en ambre (`#fbbf24`).
- **Pistes Audio Synchronisées** :
  - Affichage des formes d'onde Canvas 2D, volume slider, mute toggle, poignées de trim.
- **Panneau Bibliothèque de Scènes Flottant** :
  - Déploiement à la demande pour insérer des scènes cartographiques narratives supplémentaires.

---

## 2. Fil d'Ariane

[app/](../../app.md) -> [components/](../components.md) -> [studio/](./studio.md) -> **StudioTimeline.md**

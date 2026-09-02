Voici un plan d'implémentation pour un **mode Studio** de type CapCut, ajouté en amont de l'export, permettant de manipuler la timeline des périodes, d'y intercaler des pistes vidéo, et d'y synchroniser des pistes audio (musique, voix). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/43012280/ab811044-3f80-49a2-98a8-a8790ed33777/audi-export-vd.md?AWSAccessKeyId=ASIA2F3EMEYEWSCIKTR2&Signature=GSm%2Fs5P%2B9Q1fd7RzzchUG6anbRw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEAUaCXVzLWVhc3QtMSJGMEQCIG8q0PaX6teHXTEb7leD1yaUYMb7eLXs3GFICo4gxXNaAiABgKVRfVDNrqeeIIlw3gBhsCQ0ZXw1LmrXWLLKO8IIair8BAjN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMjXaebj3qqgWDubVXKtAE6ce9%2FFHccZX%2BxS6uM5dSNKDGP9eE7bE3F84O72nzIErIfvFVSWQZtnexwiOd3M3GDlanHbWdSj2qiSC3oW5PDX%2BUkLGrY535GMTHJ49VnLm3exaOV6pJczibH48rydtrmxlg2vzHgVGKAqGa8nr5x9Ot20FoYf2q%2BgeTXj%2BlY6iWdAWI2PBo4iTqZb3Bx9WOFt7A5cn0Y0226fZqQJnjSkJ0Uzhs6SSgjDxLAAaMahxRbAYlU1dUHxeDqVgEHt2hTwHfuBIUYPpcDAvbeCN4nuRVz%2F7st%2F%2F%2BXBkI3EOYZ9wD%2BgRd8wxr6r%2FBu2M%2FGkInIP33FW%2FoGcTngBZNCkFFEIiiTDRlSWwIN1EGo9CB5VmNres3lAvfcs7FmXO%2FZiVrd0t4jRcgCN%2B5jxuoOksEXHMQZIM2zidIGmqE8iJ1wjGVl2AGWzUXy41uRGdkzkBcdPyY%2BvMwgFh3TtvIB%2FSfBBxTooXHWFHG13TsCVKUsqFokvse9WXN7Tda66RmAMUErvzatMNEhOSN3wBdyuQEpwHi0vN%2BD0WnLrLiDM7kyh9ihFYGjGYdA%2FvOh8bBo%2Fg7P5Noo6fVDxudZ1KFF%2BDzhV1VQ8d4YCXFCh5W4IOi9o84l8CoczfpaJKgOSXwiw%2BQM%2BGLXShV008cbLQKvGOxJH0fVSGCBh1vAbaQF10Hqmwf5zbCJLo01umAsGXP8VnIh1EB3s7Zos6TwQQ12SHI2N%2BHFRoawKoDLyOItroWS4n5mkkP5jv8U2MrIM7fRlVkstd1mgL%2FVYMF903SCM%2FjXjC3iOLUBjqZAUAPckS%2Bx3fjFWsmmCkyBVktWcojVFr0%2BP0OWoZSuuzIZ%2FyGsjy7EE8PcFrEe9tjf1vpMVRbZhwoY1BVDRXKLeoiDgLYlpl%2Bl5pB40RnxXpl4nm27oaWr6dwhiy9Gk2p1ZFqk6Uyt%2FpVkr40FizjC24yoht94vYEHnEkIx5wap0LM3D5UGfRwnQUjIdoz%2F12BjI6N2lEwDa8UQ%3D%3D&Expires=1788383754)

## Architecture générale proposée

Le mode Studio s'insère comme une étape intermédiaire entre le `StoryProject` existant et le pipeline d'export déjà fiabilisé (`video-export.ts`), sans le remplacer : il produit un **plan de montage enrichi** (`EditTimeline`) qui devient la nouvelle entrée du moteur d'enregistrement. Le pipeline actuel (canvas relais, cascade de codecs, validation du Blob) reste inchangé en sortie ; seule l'entrée s'enrichit de données temporelles et audio. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/43012280/ab811044-3f80-49a2-98a8-a8790ed33777/audi-export-vd.md?AWSAccessKeyId=ASIA2F3EMEYEWSCIKTR2&Signature=GSm%2Fs5P%2B9Q1fd7RzzchUG6anbRw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEAUaCXVzLWVhc3QtMSJGMEQCIG8q0PaX6teHXTEb7leD1yaUYMb7eLXs3GFICo4gxXNaAiABgKVRfVDNrqeeIIlw3gBhsCQ0ZXw1LmrXWLLKO8IIair8BAjN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMjXaebj3qqgWDubVXKtAE6ce9%2FFHccZX%2BxS6uM5dSNKDGP9eE7bE3F84O72nzIErIfvFVSWQZtnexwiOd3M3GDlanHbWdSj2qiSC3oW5PDX%2BUkLGrY535GMTHJ49VnLm3exaOV6pJczibH48rydtrmxlg2vzHgVGKAqGa8nr5x9Ot20FoYf2q%2BgeTXj%2BlY6iWdAWI2PBo4iTqZb3Bx9WOFt7A5cn0Y0226fZqQJnjSkJ0Uzhs6SSgjDxLAAaMahxRbAYlU1dUHxeDqVgEHt2hTwHfuBIUYPpcDAvbeCN4nuRVz%2F7st%2F%2F%2BXBkI3EOYZ9wD%2BgRd8wxr6r%2FBu2M%2FGkInIP33FW%2FoGcTngBZNCkFFEIiiTDRlSWwIN1EGo9CB5VmNres3lAvfcs7FmXO%2FZiVrd0t4jRcgCN%2B5jxuoOksEXHMQZIM2zidIGmqE8iJ1wjGVl2AGWzUXy41uRGdkzkBcdPyY%2BvMwgFh3TtvIB%2FSfBBxTooXHWFHG13TsCVKUsqFokvse9WXN7Tda66RmAMUErvzatMNEhOSN3wBdyuQEpwHi0vN%2BD0WnLrLiDM7kyh9ihFYGjGYdA%2FvOh8bBo%2Fg7P5Noo6fVDxudZ1KFF%2BDzhV1VQ8d4YCXFCh5W4IOi9o84l8CoczfpaJKgOSXwiw%2BQM%2BGLXShV008cbLQKvGOxJH0fVSGCBh1vAbaQF10Hqmwf5zbCJLo01umAsGXP8VnIh1EB3s7Zos6TwQQ12SHI2N%2BHFRoawKoDLyOItroWS4n5mkkP5jv8U2MrIM7fRlVkstd1mgL%2FVYMF903SCM%2FjXjC3iOLUBjqZAUAPckS%2Bx3fjFWsmmCkyBVktWcojVFr0%2BP0OWoZSuuzIZ%2FyGsjy7EE8PcFrEe9tjf1vpMVRbZhwoY1BVDRXKLeoiDgLYlpl%2Bl5pB40RnxXpl4nm27oaWr6dwhiy9Gk2p1ZFqk6Uyt%2FpVkr40FizjC24yoht94vYEHnEkIx5wap0LM3D5UGfRwnQUjIdoz%2F12BjI6N2lEwDa8UQ%3D%3D&Expires=1788383754)

```
StoryProject → [Studio Editor: pistes vidéo/audio, extension des durées] → EditTimeline (JSON) → video-export.ts (moteur existant) → Fichier final
```

## Étape 1 — Nouveau composant `StudioTimeline.tsx`

Créer une interface de montage horizontale inspirée de CapCut, avec :

- Une piste principale "Périodes" affichant chaque scène comme un bloc redimensionnable (drag des bords pour étendre/réduire sa durée en millisecondes).
- Un curseur de lecture (playhead) synchronisé avec un aperçu live de la carte MapLibre en dessous, pour prévisualiser sans exporter.
- Un zoom horizontal de la timeline (échelle temporelle ajustable, ex: 10s/px à 1s/px) pour travailler finement sur les longs récits.
- Une bibliothèque latérale des scènes disponibles du `StoryProject`, glissables sur la timeline.

## Étape 2 — Modèle de données `EditTimeline`

Étendre le modèle existant (`periodNumber`, `totalPeriods`) avec une structure multi-pistes persistée en JSON dans le projet :

- `videoTracks: VideoClip[]` — chaque clip référence une `sceneId`, un `startMs`, une `durationMs` (modifiable indépendamment de la durée narrative d'origine) et une piste (`trackIndex`) pour permettre l'intercalation de plusieurs clips en parallèle ou en séquence.
- `audioTracks: AudioClip[]` — chaque piste typée `music` ou `voice`, avec `fileRef` (fichier importé), `startMs`, `durationMs`, `volume`, `fadeIn/fadeOut`.
- `totalDurationMs` recalculé dynamiquement comme le maximum entre la fin de la dernière piste vidéo et la dernière piste audio.

## Étape 3 — Gestion des pistes audio

Ajouter un module `audio-import.ts` distinct pour :

- Importer des fichiers audio locaux (MP3/WAV/OGG) via `<input type="file">`, décodés en `AudioBuffer` via `AudioContext.decodeAudioData`.
- Afficher une forme d'onde (waveform) simplifiée sur chaque piste audio de la timeline (calcul de pics via échantillonnage réduit, dessiné en Canvas 2D léger).
- Permettre le découpage (trim), le déplacement et le réglage de volume par piste directement dans l'interface, avec édition non destructive (les métadonnées de coupe sont stockées, le fichier source reste intact).

## Étape 4 — Extension du moteur d'export pour le multi-piste vidéo/audio

Modifier `video-export.ts` pour consommer l'`EditTimeline` au lieu de la simple liste `story.scenes` :

- Le déroulement caméra existant (`camera-orchestrator.ts`, `flyTo`, vérification GPU des entités) reste piloté par les `videoTracks`, mais respecte désormais les durées étendues définies par l'utilisateur plutôt que les durées narratives par défaut.
- Ajouter un second `AudioContext` avec un nœud `MediaStreamAudioDestinationNode` qui mixe en temps réel toutes les pistes audio actives (musique + voix, avec gains individuels), puis fusionne ce flux avec le `MediaStream` vidéo du canevas relais via `new MediaStream([...videoTrack, ...audioTracks])` avant transmission au `MediaRecorder`.
- Le mimeType cible privilégie alors les variantes avec `opus` de la cascade existante (`vp9,opus`, `vp8,opus`) déjà présentes dans `CODEC_CASCADE`, qui supportent nativement l'audio. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/43012280/ab811044-3f80-49a2-98a8-a8790ed33777/audi-export-vd.md?AWSAccessKeyId=ASIA2F3EMEYEWSCIKTR2&Signature=GSm%2Fs5P%2B9Q1fd7RzzchUG6anbRw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEAUaCXVzLWVhc3QtMSJGMEQCIG8q0PaX6teHXTEb7leD1yaUYMb7eLXs3GFICo4gxXNaAiABgKVRfVDNrqeeIIlw3gBhsCQ0ZXw1LmrXWLLKO8IIair8BAjN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMjXaebj3qqgWDubVXKtAE6ce9%2FFHccZX%2BxS6uM5dSNKDGP9eE7bE3F84O72nzIErIfvFVSWQZtnexwiOd3M3GDlanHbWdSj2qiSC3oW5PDX%2BUkLGrY535GMTHJ49VnLm3exaOV6pJczibH48rydtrmxlg2vzHgVGKAqGa8nr5x9Ot20FoYf2q%2BgeTXj%2BlY6iWdAWI2PBo4iTqZb3Bx9WOFt7A5cn0Y0226fZqQJnjSkJ0Uzhs6SSgjDxLAAaMahxRbAYlU1dUHxeDqVgEHt2hTwHfuBIUYPpcDAvbeCN4nuRVz%2F7st%2F%2F%2BXBkI3EOYZ9wD%2BgRd8wxr6r%2FBu2M%2FGkInIP33FW%2FoGcTngBZNCkFFEIiiTDRlSWwIN1EGo9CB5VmNres3lAvfcs7FmXO%2FZiVrd0t4jRcgCN%2B5jxuoOksEXHMQZIM2zidIGmqE8iJ1wjGVl2AGWzUXy41uRGdkzkBcdPyY%2BvMwgFh3TtvIB%2FSfBBxTooXHWFHG13TsCVKUsqFokvse9WXN7Tda66RmAMUErvzatMNEhOSN3wBdyuQEpwHi0vN%2BD0WnLrLiDM7kyh9ihFYGjGYdA%2FvOh8bBo%2Fg7P5Noo6fVDxudZ1KFF%2BDzhV1VQ8d4YCXFCh5W4IOi9o84l8CoczfpaJKgOSXwiw%2BQM%2BGLXShV008cbLQKvGOxJH0fVSGCBh1vAbaQF10Hqmwf5zbCJLo01umAsGXP8VnIh1EB3s7Zos6TwQQ12SHI2N%2BHFRoawKoDLyOItroWS4n5mkkP5jv8U2MrIM7fRlVkstd1mgL%2FVYMF903SCM%2FjXjC3iOLUBjqZAUAPckS%2Bx3fjFWsmmCkyBVktWcojVFr0%2BP0OWoZSuuzIZ%2FyGsjy7EE8PcFrEe9tjf1vpMVRbZhwoY1BVDRXKLeoiDgLYlpl%2Bl5pB40RnxXpl4nm27oaWr6dwhiy9Gk2p1ZFqk6Uyt%2FpVkr40FizjC24yoht94vYEHnEkIx5wap0LM3D5UGfRwnQUjIdoz%2F12BjI6N2lEwDa8UQ%3D%3D&Expires=1788383754)

## Étape 5 — Synchronisation timeline vidéo/audio

Implémenter un planificateur `TimelineScheduler` qui, au moment de l'export réel, traduit l'`EditTimeline` en une séquence d'instructions temporisées pour le `camera-orchestrator` :

- Chaque bloc vidéo déclenche son `flyTo`/`setCurrentTime` exactement à son `startMs` défini par l'utilisateur, et non plus à un rythme fixe scène par scène.
- Les pistes audio sont démarrées via `AudioBufferSourceNode.start(when)` avec un décalage calculé depuis le début global de l'export, garantissant une synchronisation image/son au milliseconde près.
- Un garde-fou vérifie qu'aucun chevauchement non désiré n'existe sur la piste vidéo principale (deux clips ne peuvent occuper le même `trackIndex` en même temps), avec résolution automatique par décalage.

## Étape 6 — Bouton et intégration UI

Ajouter un bouton **« Studio »** dans `ExportVideoModal.tsx` ou `DataPanel.tsx`, ouvrant une vue plein écran dédiée avant la génération finale :

- Le bouton "Exporter" classique reste disponible pour l'export rapide sans montage (comportement actuel inchangé).
- Le bouton "Studio" ouvre l'éditeur de timeline ; une fois le montage validé, un bouton "Générer la vidéo" transmet l'`EditTimeline` au pipeline d'export enrichi (Étape 4).

## Étape 7 — Tests et validation

Étendre `story-export.test.ts` avec des cas dédiés au mode Studio : extension/réduction de durée de période, chevauchement de clips vidéo, mixage de plusieurs pistes audio avec fondu, et vérification que le `Blob` final contient bien une piste audio (`MIN_VALID_BLOB_SIZE` adapté à la présence de son). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/43012280/ab811044-3f80-49a2-98a8-a8790ed33777/audi-export-vd.md?AWSAccessKeyId=ASIA2F3EMEYEWSCIKTR2&Signature=GSm%2Fs5P%2B9Q1fd7RzzchUG6anbRw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEAUaCXVzLWVhc3QtMSJGMEQCIG8q0PaX6teHXTEb7leD1yaUYMb7eLXs3GFICo4gxXNaAiABgKVRfVDNrqeeIIlw3gBhsCQ0ZXw1LmrXWLLKO8IIair8BAjN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMjXaebj3qqgWDubVXKtAE6ce9%2FFHccZX%2BxS6uM5dSNKDGP9eE7bE3F84O72nzIErIfvFVSWQZtnexwiOd3M3GDlanHbWdSj2qiSC3oW5PDX%2BUkLGrY535GMTHJ49VnLm3exaOV6pJczibH48rydtrmxlg2vzHgVGKAqGa8nr5x9Ot20FoYf2q%2BgeTXj%2BlY6iWdAWI2PBo4iTqZb3Bx9WOFt7A5cn0Y0226fZqQJnjSkJ0Uzhs6SSgjDxLAAaMahxRbAYlU1dUHxeDqVgEHt2hTwHfuBIUYPpcDAvbeCN4nuRVz%2F7st%2F%2F%2BXBkI3EOYZ9wD%2BgRd8wxr6r%2FBu2M%2FGkInIP33FW%2FoGcTngBZNCkFFEIiiTDRlSWwIN1EGo9CB5VmNres3lAvfcs7FmXO%2FZiVrd0t4jRcgCN%2B5jxuoOksEXHMQZIM2zidIGmqE8iJ1wjGVl2AGWzUXy41uRGdkzkBcdPyY%2BvMwgFh3TtvIB%2FSfBBxTooXHWFHG13TsCVKUsqFokvse9WXN7Tda66RmAMUErvzatMNEhOSN3wBdyuQEpwHi0vN%2BD0WnLrLiDM7kyh9ihFYGjGYdA%2FvOh8bBo%2Fg7P5Noo6fVDxudZ1KFF%2BDzhV1VQ8d4YCXFCh5W4IOi9o84l8CoczfpaJKgOSXwiw%2BQM%2BGLXShV008cbLQKvGOxJH0fVSGCBh1vAbaQF10Hqmwf5zbCJLo01umAsGXP8VnIh1EB3s7Zos6TwQQ12SHI2N%2BHFRoawKoDLyOItroWS4n5mkkP5jv8U2MrIM7fRlVkstd1mgL%2FVYMF903SCM%2FjXjC3iOLUBjqZAUAPckS%2Bx3fjFWsmmCkyBVktWcojVFr0%2BP0OWoZSuuzIZ%2FyGsjy7EE8PcFrEe9tjf1vpMVRbZhwoY1BVDRXKLeoiDgLYlpl%2Bl5pB40RnxXpl4nm27oaWr6dwhiy9Gk2p1ZFqk6Uyt%2FpVkr40FizjC24yoht94vYEHnEkIx5wap0LM3D5UGfRwnQUjIdoz%2F12BjI6N2lEwDa8UQ%3D%3D&Expires=1788383754)

## Récapitulatif des nouveaux fichiers/modules

| Module | Rôle |
|---|---|
| `StudioTimeline.tsx` | Interface de montage multi-pistes type CapCut |
| `audio-import.ts` | Import, décodage et gestion des fichiers audio |
| `EditTimeline` (type) | Modèle de données pistes vidéo/audio + durées étendues |
| `TimelineScheduler.ts` | Synchronisation temporelle caméra + audio |
| `video-export.ts` (étendu) | Mixage audio + capture vidéo existante |

Cette approche préserve entièrement le pipeline d'export déjà audité et noté 4.9/5 (canvas relais, cascade de codecs, validation du Blob) en le faisant évoluer d'une entrée séquentielle simple vers une entrée multi-pistes pilotée par l'éditeur Studio. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/43012280/ab811044-3f80-49a2-98a8-a8790ed33777/audi-export-vd.md?AWSAccessKeyId=ASIA2F3EMEYEWSCIKTR2&Signature=GSm%2Fs5P%2B9Q1fd7RzzchUG6anbRw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEAUaCXVzLWVhc3QtMSJGMEQCIG8q0PaX6teHXTEb7leD1yaUYMb7eLXs3GFICo4gxXNaAiABgKVRfVDNrqeeIIlw3gBhsCQ0ZXw1LmrXWLLKO8IIair8BAjN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMjXaebj3qqgWDubVXKtAE6ce9%2FFHccZX%2BxS6uM5dSNKDGP9eE7bE3F84O72nzIErIfvFVSWQZtnexwiOd3M3GDlanHbWdSj2qiSC3oW5PDX%2BUkLGrY535GMTHJ49VnLm3exaOV6pJczibH48rydtrmxlg2vzHgVGKAqGa8nr5x9Ot20FoYf2q%2BgeTXj%2BlY6iWdAWI2PBo4iTqZb3Bx9WOFt7A5cn0Y0226fZqQJnjSkJ0Uzhs6SSgjDxLAAaMahxRbAYlU1dUHxeDqVgEHt2hTwHfuBIUYPpcDAvbeCN4nuRVz%2F7st%2F%2F%2BXBkI3EOYZ9wD%2BgRd8wxr6r%2FBu2M%2FGkInIP33FW%2FoGcTngBZNCkFFEIiiTDRlSWwIN1EGo9CB5VmNres3lAvfcs7FmXO%2FZiVrd0t4jRcgCN%2B5jxuoOksEXHMQZIM2zidIGmqE8iJ1wjGVl2AGWzUXy41uRGdkzkBcdPyY%2BvMwgFh3TtvIB%2FSfBBxTooXHWFHG13TsCVKUsqFokvse9WXN7Tda66RmAMUErvzatMNEhOSN3wBdyuQEpwHi0vN%2BD0WnLrLiDM7kyh9ihFYGjGYdA%2FvOh8bBo%2Fg7P5Noo6fVDxudZ1KFF%2BDzhV1VQ8d4YCXFCh5W4IOi9o84l8CoczfpaJKgOSXwiw%2BQM%2BGLXShV008cbLQKvGOxJH0fVSGCBh1vAbaQF10Hqmwf5zbCJLo01umAsGXP8VnIh1EB3s7Zos6TwQQ12SHI2N%2BHFRoawKoDLyOItroWS4n5mkkP5jv8U2MrIM7fRlVkstd1mgL%2FVYMF903SCM%2FjXjC3iOLUBjqZAUAPckS%2Bx3fjFWsmmCkyBVktWcojVFr0%2BP0OWoZSuuzIZ%2FyGsjy7EE8PcFrEe9tjf1vpMVRbZhwoY1BVDRXKLeoiDgLYlpl%2Bl5pB40RnxXpl4nm27oaWr6dwhiy9Gk2p1ZFqk6Uyt%2FpVkr40FizjC24yoht94vYEHnEkIx5wap0LM3D5UGfRwnQUjIdoz%2F12BjI6N2lEwDa8UQ%3D%3D&Expires=1788383754)
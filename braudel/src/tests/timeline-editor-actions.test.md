# Documentation — Tests des Opérations de Montage Timeline (`timeline-editor-actions.test.ts`)

Cette suite de tests valide la précision et la résilience des outils de montage du Mode Studio :
- **Découpage au playhead (`splitClipAtTime`)** : vérifie la scission en deux fragments contigus, l'ajustement respectif de `trimStartMs` et `trimEndMs`, et les gardes contre les coupes hors limites (< 150ms des bords).
- **Presse-papiers (`copyClip`, `cutClip`, `pasteClip`)** : valide la préservation de l'intégrité des clips sources, l'attribution d'identifiants uniques aux éléments collés, et la résolution automatique des collisions sur les pistes vidéo et audio.
- **Rognage temporel non destructif (`applyCropTemporal`)** : vérifie le calcul cohérent des bornes temporelles et le plancher de sécurité de 300ms.
- **Importation multimédia (`importMediaFile`)** : valide la création de clips `image` et `video` avec métadonnées extraites, ainsi que le rejet immédiat des fichiers non pris en charge.

---

## Fil d'Ariane

[tests/](./tests.md) -> **timeline-editor-actions.test.md**

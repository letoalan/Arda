# Script de Build CLI — `scripts/preproject-eckert4.ts`

Script utilitaire Node.js conforme à la **Phase 2** de [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md) permettant de pré-projeter hors ligne (au build ou lors de l'intégration de jeux de données) des fichiers GeoJSON sous la projection **Eckert IV (`ESRI:54012`)**.

---

## 1. Utilisation

```bash
npx tsx scripts/preproject-eckert4.ts <input.geojson> [output.geojson]
```

### Exemple
```bash
npx tsx scripts/preproject-eckert4.ts public/data/18-world_100.geojson public/data/eckert4/18-world_100.geojson
```

---

## 2. Fonctionnement

1. Charge le GeoJSON source WGS84.
2. Initialise PROJ WebAssembly et compile le transformateur `ESRI:54012`.
3. Reprojette l'ensemble des sommets en coordonnées fake Mercator avec conservation d'aspect ratio.
4. Écrit le résultat dans le dossier cible.
5. Termine proprement les workers Wasm.

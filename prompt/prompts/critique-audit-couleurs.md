# Critique de l'Audit Colorimétrique — Vers des Palettes Plus Réalistes

## 1. Constat général sur l'audit initial

L'audit `audit_colors.md` documente 8 palettes construites sur un principe d'extrapolation continue Mer → Terre → Sommets, avec une logique de mélange progressif cohérente et bien pensée sur le plan technique. Cependant, la plupart des critiques internes à l'audit restent **esthétiques** (fatigue visuelle, contraste, saturation) sans jamais interroger la **fidélité géophysique** des couleurs choisies — c'est le point central de cette contre-évaluation.

Trois problèmes transversaux reviennent dans presque toutes les palettes :

1. **Sur-saturation systématique** des teintes (bleus lapis-lazuli purs, verts menthe, rouges sang) qui n'existent jamais à cette intensité dans les données de télédétection réelles (MODIS, Copernicus, Natural Earth).
2. **Absence de gradient latitudinal/climatique** : une seule courbe de couleur "terre" s'applique à toute la planète, alors que le relief réel varie fortement selon qu'on est en zone désertique, tempérée, boréale ou tropicale.
3. **Hypsométrie non conforme aux conventions cartographiques** : les vraies cartes topographiques (IGN, USGS, Natural Earth) utilisent des courbes de teinte spécifiques (vert → jaune → brun → blanc) calibrées pour rester lisibles à toutes les échelles, ce qui n'est respecté que partiellement ici.

---

## 2. Critique détaillée par style et propositions réalistes

### 2.1 High Fantasy (Tolkien Épique)

**Critique** : Le bleu marine `#0c1b2d` est plausible pour les fosses abyssales, mais le parchemin doré `#e6cf9c` en littoral ne correspond à aucune réalité géophysique — les plages et zones côtières réelles sont majoritairement grises (sédiments), vertes (végétation basse) ou brun-rouille (latérite), rarement dorées de façon uniforme.

**Palette plus réaliste** :
- Fosses : `#0a1830` → `#123a5c` (bleu abyssal Copernicus, moins saturé que l'original)
- Littoral/Plaines basses : `#8a9a6e` (vert olivâtre de prairie réelle, type steppe) plutôt que doré
- Collines/Montagnes : `#6f7a4f` → `#5a4a3a` (transition végétation → roche nue, conforme aux DEM réels)
- Pics : `#e8e4de` (gris-blanc neige sale, jamais blanc pur en réalité — la neige de haute altitude contient toujours de la poussière minérale)

### 2.2 Light Fantasy (Féerique / Ghibli)

**Critique** : Le turquoise `#33a1a6` n'existe dans la nature que sur des lagons tropicaux à fond sableux clair (Maldives, Bora Bora) — l'appliquer à un océan générique est géographiquement incohérent pour la majorité des mers du globe.

**Palette plus réaliste** :
- Océan (norme générale) : `#1a4d5c` → `#2d6b7a` (bleu-vert désaturé de type Atlantique Nord, plus crédible à l'échelle mondiale)
- Réserver le turquoise `#33a1a6` uniquement à une bande intertropicale (\(-23.5 degrés\) à \(23.5 degrés\)) via un dégradé latitudinal, pas sur toute la carte
- Plaines : `#d8d2b8` (beige-vert naturel de savane/prairie) plutôt que crème ivoire pure
- Reliefs : `#a8bb8a` → `#7a9060` (vert forêt réel désaturé, jamais aussi lumineux que `#d2f2cb`)

### 2.3 Dark Fantasy (Terres Maudites / Mordor)

**Critique** : Le rouge lave `#990000` en pic est visuellement fort mais géophysiquement isolé — dans la réalité, seuls des volcans actifs très spécifiques (Kilauea, Etna) présentent cette teinte, jamais des chaînes montagneuses entières.

**Palette plus réaliste** :
- Conserver l'esprit sombre mais ancrer la roche réelle : `#3a3230` (basalte gris-brun) → `#241d1a` (roche volcanique refroidie)
- Réserver le rouge lave à des points d'intérêt ponctuels (cratères actifs) plutôt qu'à toute la courbe hypsométrique
- Océan : `#0d0f14` → `#1a1f28` (noir bleuté réaliste de mer profonde peu éclairée) plutôt que le rouge-noir actuel qui n'a pas d'équivalent physique

### 2.4 Antiquité (Table de Peutinger)

**Critique** : Cette palette est la plus honnête historiquement (elle imite un artefact réel), donc la notion de "réalisme géophysique" s'applique moins ; elle reste cohérente dans son registre.

**Amélioration mineure** : Ajouter une légère variation de teinte sépia selon l'altitude réelle des grands massifs (Alpes, Atlas, Zagros) pour que les zones élevées connues historiquement restent identifiables sans casser l'esthétique parchemin.

### 2.5 Moyen-Âge (Manuscrits à Enluminures)

**Critique** : L'or pur `#ffd700` en pic est un choix décoratif fort mais anti-réaliste à l'extrême — aucun sommet terrestre n'est doré. Assumé comme un choix artistique volontaire (dans l'esprit des enluminures), il n'a pas vocation à être "corrigé" mais pourrait être nuancé pour rester lisible sur de grandes surfaces.

**Ajustement réaliste modéré** : `#ffd700` → `#e8c468` (or plus mat, moins criard) pour limiter la fatigue oculaire signalée dans l'audit, tout en gardant l'esprit enluminure.

### 2.6 Renaissance (Cartes Portulans)

**Critique** : C'est effectivement la palette la plus proche d'un rendu réaliste actuel, comme le note l'audit original. Peu de corrections nécessaires.

**Ajustement mineur** : Le blanc argenté pur `#ffffff` en pic peut être remplacé par `#e6e2da` (blanc cassé) pour cohérence avec le rendu neige réel évoqué en 2.1.

### 2.7 Colonial (Cartographie XIXe)

**Critique** : Cohérent avec l'esthétique d'atlas ancien ; le manque de relief perçu vient d'une désaturation excessive plutôt que d'un problème de réalisme géophysique en soi.

**Ajustement réaliste** : Réintroduire un contraste hypsométrique plus marqué en s'inspirant des atlas Vidal de la Blache réels, qui utilisaient des bandes de teinte plus contrastées que la palette actuelle malgré leur aspect "délavé".

### 2.8 Futuriste / Cyberpunk

**Critique** : Ce style est explicitement anti-réaliste par nature (rendu holographique/radar) ; aucune correction géophysique n'est pertinente ici. Le maintenir hors du périmètre de "réalisme" est le bon choix éditorial.

---

## 3. Proposition d'un neuvième style : « Réaliste / Satellite »

Pour répondre pleinement à la demande d'options plus réalistes, il est proposé d'ajouter un style dédié, calibré directement sur les conventions de télédétection et de cartographie hypsométrique professionnelle (Natural Earth, dérivé du gradient de Cynthia Brewer utilisé en cartographie scientifique) :

| Zone | Couleur | Référence |
|---|---|---|
| Fosses abyssales (-6000 à -2000m) | `#0a2138` | Bleu abyssal Copernicus Marine |
| Plateau continental (-2000 à -200m) | `#1c4966` | Bleu océanique standard |
| Eaux côtières (-200 à 0m) | `#3d7a8c` | Bleu-vert littoral désaturé |
| Plaines basses (0 à 200m) | `#7a9456` | Vert végétation tempérée |
| Collines (200 à 800m) | `#a08d5c` | Brun-vert transition |
| Montagnes (800 à 2500m) | `#8a7355` | Brun roche/sol nu |
| Haute montagne (2500 à 4000m) | `#a8a296` | Gris minéral |
| Sommets neigeux (> 4000m) | `#e6e2da` | Blanc cassé (neige sale) |

Cette palette applique la convention hypsométrique standard utilisée en cartographie physique réelle, avec une désaturation générale (aucune teinte pure à 100% de saturation) pour rester crédible à l'écran comme à l'impression.

---

## 4. Synthèse comparative

| Style | Réalisme actuel | Recommandation |
|---|---|---|
| High Fantasy | Faible (doré non naturel) | Corriger le littoral, dessaturer les pics |
| Light Fantasy | Faible (turquoise généralisé) | Restreindre le turquoise à la zone intertropicale |
| Dark Fantasy | Très faible (volontaire) | Conserver l'esprit, isoler le rouge lave aux points d'intérêt |
| Antiquité | Non applicable (historique) | Aucune correction nécessaire |
| Moyen-Âge | Non applicable (décoratif) | Nuancer l'or pour le confort visuel uniquement |
| Renaissance | Élevé | Ajustement mineur du blanc des pics |
| Colonial | Moyen | Réintroduire du contraste hypsométrique |
| Cyberpunk | Non applicable (assumé) | Aucune correction nécessaire |
| **Réaliste/Satellite (nouveau)** | Élevé (référence) | Nouveau style à ajouter au sélecteur |

---

## 5. Recommandation d'implémentation

Ajouter le style « Réaliste / Satellite » dans `styles.config.ts` comme neuvième entrée du sélecteur, avec sa propre courbe hypsométrique à 8 paliers (au lieu des 3-4 paliers actuels), en réutilisant le même moteur d'extrapolation continue Mer → Terre → Sommets déjà en place, sans modification du pipeline de rendu MapLibre.

# Conseils Stylistiques et Colorimétriques — Amélioration des 8 Styles de Rendu

## 1. Objectif du document

Ce document synthétise les recommandations concrètes pour chaque style de rendu du mode Tolkien, à partir de la double critique menée sur le parti pris stylistique et le choix colorimétrique. L'objectif n'est pas de renier les intentions déjà posées dans `audit_colors.md`, mais de resserrer l'écart entre l'intention narrative de chaque style et son exécution visuelle.

---

## 2. Principe directeur commun

Avant le détail par style, un principe transversal doit guider toutes les corrections : **une référence culturelle citée doit être traduite avec la même retenue qu'elle a dans son contexte d'origine**. L'or des enluminures est un rehaut ponctuel, pas une couleur de masse ; l'aquarelle Ghibli est désaturée, pas saturée ; l'artisanat des cartes dessinées à la main est irrégulier, pas lissé. Chaque correction proposée ci-dessous découle de ce principe.

---

## 3. Recommandations par style

### 3.1 High Fantasy (Tolkien Épique)

**Problème** : palette trop nette et trop saturée pour une esthétique "fait main".

**Conseils** :
- Introduire une texture de grain léger (bruit procédural à faible opacité) sur les couches terre et mer pour casser l'aspect numérique lissé.
- Adoucir le bleu marine `#0c1b2d` vers `#132433` (moins saturé, plus proche d'une encre diluée).
- Insérer un palier gris-roche `#8a8378` entre le brun terre et le blanc neige pour éviter la rupture brutale déjà identifiée.
- Ajouter un léger tremblement (jitter) sur les tracés de côtes pour simuler un contour dessiné à la main plutôt que vectorisé.

### 3.2 Light Fantasy (Féerique / Ghibli)

**Problème** : couleurs trop pures, en décalage avec l'aquarelle désaturée de la référence.

**Conseils** :
- Désaturer l'ensemble de la palette de 15 à 20% (turquoise `#33a1a6` → `#4a8f92`, vert menthe `#d2f2cb` → `#c3dcb8`).
- Ajouter un léger flou gaussien sur les transitions de teinte pour imiter le fondu de l'aquarelle plutôt qu'un dégradé numérique net.
- Réduire l'écart de luminosité entre océan et littoral pour limiter la fatigue oculaire déjà signalée.
- Réserver les blancs éclatants (`#fbfdfa`) aux seuls pics, jamais aux zones de plaine ou de littoral.

### 3.3 Dark Fantasy (Terres Maudites / Mordor)

**Problème** : cohérence stylistique excellente, mais lisibilité fonctionnelle sacrifiée.

**Conseils** :
- Conserver la palette actuelle sans modification (le parti pris est le mieux exécuté de la série).
- Ajouter un liseré luminescent orange braise (`#ff6b35`, faible opacité, effet glow) systématique sur toutes les entités utilisateur (routes, frontières, points) pour garantir leur lisibilité sans diluer l'ambiance.
- Documenter explicitement ce style comme "mode immersion" plutôt que "mode édition standard" dans l'interface, pour cadrer les attentes d'usage.

### 3.4 Antiquité (Table de Peutinger)

**Problème** : fidélité historique forte, mais lisibilité contemporaine en tension.

**Conseils** :
- Ne pas corriger la palette elle-même (elle constitue une citation documentaire fidèle).
- Ajouter un mode d'assistance visuelle optionnel : au survol ou à la sélection, afficher un contour bleu clair discret pour distinguer temporairement mer et terre sans altérer le rendu de base.
- Signaler ce compromis explicitement dans l'interface ("Style fidèle à l'original, contraste réduit") pour que l'utilisateur comprenne le choix plutôt que de le percevoir comme un défaut.

### 3.5 Moyen-Âge (Manuscrits à Enluminures)

**Problème** : l'or est appliqué en masse alors qu'il devrait rester un rehaut ponctuel.

**Conseils** :
- Remplacer l'or pur `#ffd700` en pic par un or mat `#d4af37`, réservé aux seuls sommets les plus élevés (au-delà d'un seuil altimétrique strict) plutôt qu'à toute la bande "pics".
- Introduire du vert sapin médiéval `#3d5c3a` dans les plaines pour rompre la monotonie dorée, comme suggéré dans la critique initiale.
- Ajouter des motifs décoratifs discrets (filigranes, entrelacs) en bordure de carte plutôt que dans le corps du rendu, pour concentrer l'effet "enluminure" aux marges sans saturer la lecture centrale.

### 3.6 Renaissance (Cartes Portulans)

**Problème** : aucun défaut réel, seulement une confusion de critères dans la critique initiale (le manque de "drame" est un choix, pas un défaut).

**Conseils** :
- Ne pas ajouter de contraste hypsométrique supplémentaire ; la sobriété est l'intention et doit être préservée.
- Remplacer uniquement le blanc pur des pics `#ffffff` par `#e8e3d8` (blanc cassé) pour cohérence avec le rendu neige réaliste déjà recommandé sur d'autres styles.
- Ajouter les roses des vents et lignes de rhumb (déjà prévues dans l'audit Braudel) comme éléments décoratifs plutôt que de complexifier la palette elle-même.

### 3.7 Colonial (Cartographie XIXe)

**Problème** : parti pris trop générique, sans ancrage sur un atlas historique précis.

**Conseils** :
- Nommer explicitement une référence cartographique historique (ex. atlas Vidal de la Blache ou Stieler) pour ancrer le style et guider les choix futurs de palette.
- Réintroduire un contraste hypsométrique plus marqué en s'inspirant des bandes de teinte contrastées de ces atlas réels, plutôt que de rester sur une désaturation uniforme.
- Ajouter une trame de gravure fine (hachures) sur les zones de relief pour renforcer l'identité graphique XIXe, actuellement trop lisse.

### 3.8 Futuriste / Cyberpunk (Néon Holographique)

**Problème** : rupture de cohérence avec les sept autres styles, question d'intégration éditoriale plutôt que de couleur.

**Conseils** :
- Conserver la palette actuelle (l'exécution du parti pris néon est réussie).
- Ajouter les lignes de trame scannée (scanlines) déjà suggérées, avec un léger effet de pulsation pour renforcer l'immersion holographique.
- Isoler ce style dans une section "Modes expérimentaux" distincte du sélecteur principal, pour clarifier qu'il répond à une logique différente des sept styles historiques/fantasy.

---

## 4. Synthèse des priorités d'implémentation

| Style | Priorité | Type de correction |
|---|---|---|
| Light Fantasy | Haute | Désaturation + flou de transition |
| Moyen-Âge | Haute | Réduction de la surface dorée, ajout de vert sapin |
| High Fantasy | Moyenne | Grain/texture, palier gris-roche |
| Colonial | Moyenne | Ancrage historique + hachures |
| Dark Fantasy | Faible | Liseré de lisibilité uniquement |
| Renaissance | Faible | Ajustement mineur du blanc des pics |
| Antiquité | Faible | Aide visuelle optionnelle, pas de correction de palette |
| Cyberpunk | Faible | Isolation dans une catégorie séparée |

---

## 5. Remarque finale sur la présentation générale

Au-delà des palettes individuelles, la présentation globale du sélecteur de styles gagnerait à afficher, pour chaque style, sa référence culturelle explicite (nom de l'artefact ou du courant cité) directement dans l'interface, plutôt que dans la documentation seule. Cela transformerait chaque choix de style en une décision informée pour l'utilisateur, cohérente avec la démarche pédagogique et historique du projet Braudel.

# Audit des Choix de Couleurs — Reliefs Tolkien

Cet audit présente les choix colorimétriques appliqués au système d'extrapolation continue (Mer → Terre → Sommets) pour chaque fond de carte (style) disponible en mode Tolkien, avec une critique constructive pour chaque configuration.

---

## Principes de l'Extrapolation Continue

Pour garantir des rivages fluides sans falaises visuelles abruptes de 1200 mètres d'élévation, les couleurs sont calculées dynamiquement selon les règles suivantes :
1. **Origine** : La couleur de base est celle de la mer (`water` ou `background` du style).
2. **Fosses (-2000m à -100m)** : Assombrissement progressif de la mer (jusqu'à -55%) pour donner une sensation d'abysse.
3. **Plateaux/Dorsales (-15m à 0m)** : Éclaircissement progressif de la mer vers la terre (mélange avec le blanc/lumière).
4. **Plaines (0m à 40m)** : Transition continue entre la couleur littorale (mélange 40% terre / 60% mer) et la couleur de terre pure (`landcover`).
5. **Collines et Montagnes (40m à 250m)** : Mélange de la terre avec la couleur d'ombres d'origine (`hillshadeShadow`) du style.
6. **Pics (> 250m)** : Transition vers la couleur de lumière d'origine du style (`hillshadeHighlight`).

---

## 1. High Fantasy (Tolkien Épique)
*   **Palette d'origine** : Mer bleue profonde, terre parchemin doré, forêts vert olive, ombres brunes, pics blancs.
*   **Fosses / Océan** : Bleu marine sombre (`#0c1b2d`) → Bleu saphir (`#152e4d`).
*   **Littoral / Plaines** : Parchemin doré sablonneux (`#e6cf9c`).
*   **Reliefs / Pics** : Vert olive chaud (`#9aa67a`) → Brun terre (`#6c563e`) → Blanc neige (`#ffffff`).
*   **Justification** : Recrée l'ambiance des cartes de la Terre du Milieu (dessinées à la main). La transition bleu-parchemin donne un effet d'estran sablonneux très naturel.
*   **Critique** : Les pics blancs contrastent fortement avec le vert-brun, ce qui peut paraître trop abrupt si le pic est isolé. 
*   **Amélioration possible** : Ajouter un dégradé intermédiaire gris de roche juste avant la neige des sommets.

## 2. Light Fantasy (Féerique / Ghibli)
*   **Palette d'origine** : Mer turquoise cristallin, terre crème clair, collines vert tendre, montagnes vert forêt, pics blancs brillants.
*   **Fosses / Océan** : Turquoise profond (`#1d7074`) → Turquoise clair (`#33a1a6`).
*   **Littoral / Plaines** : Crème ivoire lumineuse (`#faf5eb`).
*   **Reliefs / Pics** : Vert menthe clair (`#d2f2cb`) → Vert forêt luxuriant (`#b4e3ad`) → Blanc éclatant (`#fbfdfa`).
*   **Justification** : Donne une esthétique poétique, elfique ou proche des films d'animation Ghibli. Les couleurs sont très fraîches et lumineuses.
*   **Critique** : Le contraste entre l'océan turquoise très saturé et la plaine crème très claire peut fatiguer la vue sur de larges sessions d'édition.
*   **Amélioration possible** : Désaturer légèrement la couleur de l'eau peu profonde pour adoucir le rivage.

## 3. Dark Fantasy (Terres Maudites / Mordor)
*   **Palette d'origine** : Mer noir-rougeâtre, terre gris foncé, collines cendre, montagnes roche brûlée, pics rouge lave.
*   **Fosses / Océan** : Noir d'encre (`#120202`) → Rouge sang séché (`#280505`).
*   **Littoral / Plaines** : Anthracite / Basalte (`#111111`).
*   **Reliefs / Pics** : Gris cendre (`#2e2929`) → Brun brûlé/suie (`#4f4040`) → Rouge lave/volcanique (`#990000`).
*   **Justification** : Parfait pour les régions maudites, les volcans ou les royaumes maléfiques. La transition noir-rouge-gris est très immersive.
*   **Critique** : L'affichage est globalement très sombre, rendant les vecteurs et les routes de l'utilisateur parfois difficiles à distinguer.
*   **Amélioration possible** : Utiliser des bordures ou des lignes d'entités avec un liseré luminescent (ex. orange braise) pour détacher le contenu utilisateur du fond.

## 4. Antiquité (Table de Peutinger)
*   **Palette d'origine** : Mer sépia clair/jaunie, terre parchemin peutinger, collines orange-sépia, montagnes cuir rouge, pics brique sombre.
*   **Fosses / Océan** : Sépia sombre (`#625139`) → Sépia clair (`#a68d6c`).
*   **Littoral / Plaines** : Parchemin jauni romain (`#e8d5a3`).
*   **Reliefs / Pics** : Orange-ocre (`#cca174`) → Cuir patiné (`#a06644`) → Rouge brique Peutinger (`#8b442b`).
*   **Justification** : Rendu historique fidèle aux manuscrits médiévaux copiant les cartes romaines. L'absence de bleu donne un cachet antique inimitable.
*   **Critique** : Différencier la terre et la mer demande un temps d'adaptation car la mer est beige-jaune et non bleue.
*   **Amélioration possible** : Accentuer légèrement la saturation du sépia marin pour mieux détacher l'océan.

## 5. Moyen-Âge (Manuscrits à Enluminures)
*   **Palette d'origine** : Mer bleu lapis-lazuli, terre or/ocre, collines ocre jaune, montagnes bronze, pics or brillant.
*   **Fosses / Océan** : Bleu nuit royal (`#08102d`) → Bleu lapis-lazuli (`#1a2f6c`).
*   **Littoral / Plaines** : Parchemin or pale (`#dfc78c`).
*   **Reliefs / Pics** : Ocre doré (`#c1a65d`) → Bronze foncé (`#896a32`) → Or pur brillant (`#ffd700`).
*   **Justification** : Reflète la richesse des enluminures médiévales combinant l'or précieux et le bleu lapis-lazuli importé d'Orient.
*   **Critique** : L'abondance de jaune et d'or sur le continent peut saturer l'écran.
*   **Amélioration possible** : Introduire des touches de vert sapin médiéval pour les plaines afin de reposer l'œil.

## 6. Renaissance (Cartes Portulans)
*   **Palette d'origine** : Mer bleu-vert turquoise/gris, terre ivoire, collines sable, montagnes argile grise, pics argent.
*   **Fosses / Océan** : Vert-bleu sombre (`#163a3c`) → Bleu-vert Portulan (`#2c5f61`).
*   **Littoral / Plaines** : Ivoire Renaissance (`#efe5cd`).
*   **Reliefs / Pics** : Sable beige (`#d2bd9a`) → Argile marron (`#9b8462`) → Blanc argenté (`#ffffff`).
*   **Justification** : Imite les cartes maritimes des grandes découvertes. Les teintes sont douces, équilibrées et très reposantes.
*   **Critique** : C'est le style le plus équilibré, mais il peut manquer de relief dramatique par rapport à High Fantasy.
*   **Amélioration possible** : Augmenter légèrement l'exagération de l'ombrage (hillshade) pour ce style afin de détacher les montagnes.

## 7. Colonial (Cartographie XIXe)
*   **Palette d'origine** : Mer bleue délavée, terre papier blanc jauni, collines vert délavé, montagnes olive, pics brun.
*   **Fosses / Océan** : Bleu-gris sombre (`#15222e`) → Bleu colonial (`#223547`).
*   **Littoral / Plaines** : Papier colonial blanc-cassé (`#fbfaf3`).
*   **Reliefs / Pics** : Vert-jaune délavé (`#e4deb9`) → Vert olive (`#bcae83`) → Brun-ocre (`#a8976b`).
*   **Justification** : Ambiance d'atlas du XIXe siècle. Très propre et professionnel.
*   **Critique** : Les plaines blanches font ressortir les moindres détails, mais le relief général est très plat en raison des couleurs désaturées.
*   **Amélioration possible** : Marquer plus fortement les collines en assombrissant leur base.

## 8. Futuriste / Cyberpunk (Néon Holographique)
*   **Palette d'origine** : Mer bleu nuit technologique, plaines bleu nuit sombre, collines cyan lumineux, montagnes magenta néon, pics blanc néon.
*   **Fosses / Océan** : Noir néant (`#010103`) → Bleu abysse (`#050a14`).
*   **Littoral / Plaines** : Bleu nuit technologique (`#080d1a`).
*   **Reliefs / Pics** : Cyan électrique (`#1f4068`) → Magenta néon (`#e94560`) → Blanc électrique (`#00f5ff`).
*   **Justification** : Rendu unique imitant une console holographique ou une carte radar cyberpunk. Le contraste sombre/néon est saisissant.
*   **Critique** : S'éloigne radicalement de l'esprit "Fantasy classique", mais offre un mode alternatif très fort.
*   **Amélioration possible** : Ajouter des lignes de trame scannée (scanlines) sur la terre pour renforcer l'effet hologramme.

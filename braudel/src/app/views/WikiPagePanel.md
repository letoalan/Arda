# Documentation — Vue Wiki & Pseudopages (`WikiPagePanel.tsx`)

## Rôle & Responsabilité
`WikiPagePanel.tsx` constitue l'interface encyclopédique et de rédaction Markdown pour chaque entité du monde :
1. **Modale Glassmorphism & Header** : Titre de l'entité, badge de type (Lieu, Acteur, Événement...), intervalle temporel et bascule Aperçu/Édition.
2. **Barre d'outils Markdown Rapide** :
   - Insertion de titres (`##`), mise en gras (`**`), italique (`*`), listes à puces (`-`), citations (`>`).
   - Insertion de Wikilinks guidée avec sélecteur déroulant des entités du monde actif.
3. **Parseur & Rendu Interactif** :
   - Rendu Markdown temps réel.
   - Wikilinks interactifs `[[Nom]]` cliquables vers l'entité liée.
   - Détection des liens brisés avec surbrillance d'alerte pointillée rouge.
4. **Réseau Encyclopédique** : Encart listant l'ensemble des entités connectées par la fiche.

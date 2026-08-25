# Demarche de Documentation "Wiki-as-Code" - Projet ARDA / Braudel / Tolkien

## Objectif

Mettre en place une documentation systematique et interconnectee du code source, ou chaque fichier source est double d'un fichier .md de documentation, et ou ces fichiers sont relies entre eux par une hierarchie de liens allant du fichier individuel jusqu'au projet global - a la maniere d'un wiki technique navigable directement dans le depot.

---

## Principe directeur

Chaque unite de code (fichier, dossier, module, secteur fonctionnel) possede un miroir documentaire .md au meme niveau, avec un systeme de liens ascendants (vers le dossier parent) et descendants (vers les fichiers enfants), plus des liens transversaux (dependances entre fichiers non hierarchiques, ex. store.ts qui depend de geopoliticaImporter.ts).

La documentation ne doit jamais etre un simple resume isole : chaque fichier .md doit repondre a trois questions - "a quoi sert ce fichier ?", "avec quoi interagit-il ?", "ou se situe-t-il dans l'architecture globale ?".

---

## Structure cible

```
ARDA/
├── README.md                        (racine — vue projet)
├── docs/
│   └── ARCHITECTURE.md              (vue globale, carte des secteurs)
├── src/
│   ├── src.md                       (doc du dossier src)
│   ├── services/
│   │   ├── services.md              (doc du secteur services)
│   │   ├── geopoliticaImporter.ts
│   │   ├── geopoliticaImporter.md   (doc du fichier)
│   │   ├── maplibre.ts
│   │   ├── maplibre.md
│   │   ├── indexeddb.ts
│   │   └── indexeddb.md
│   ├── store/
│   │   ├── store.md
│   │   ├── store.ts
│   ├── components/
│   │   ├── components.md
│   │   ├── GeopoliticaPanel.tsx
│   │   ├── GeopoliticaPanel.md
│   │   ├── ImportPreviewModal.tsx
│   │   └── ImportPreviewModal.md
│   └── registry/
│       ├── registry.md
│       ├── geopoliticaRegistry.ts
│       ├── geopoliticaRegistry.md
│       ├── geojson-catalog-service.ts
│       └── geojson-catalog-service.md
```

Chaque .md de dossier (ex. services.md) agit comme un sommaire de secteur, et chaque .md de fichier (ex. maplibre.md) agit comme une fiche technique unitaire.

---

## Niveau 1 - Fiche fichier (nomDuFichier.md)

Gabarit standard pour chaque fichier source :

```markdown
# maplibre.ts

## Role
Service d'integration cartographique MapLibre GL. Injecte les geometries dans les sources GeoJSON et applique les styles visuels.

## Emplacement
src/services/maplibre.ts

## Dependances entrantes (qui appelle ce fichier)
- store.ts (../store/store.md) - appelle addLayerToMap apres mise a jour du store
- GeopoliticaPanel.tsx (../components/GeopoliticaPanel.md)

## Dependances sortantes (ce que ce fichier utilise)
- indexeddb.ts (./indexeddb.md) - lecture des entites persistees

## Fonctions cles
- addLayerToMap(entities, layerId) - injecte les geometries dans la source GeoJSON de la carte
- applyLayerStyle(layerId, style) - applique couleur, opacite, traits

## Points d'attention / dette technique
- Pas de garde-fou sur les fichiers volumineux (ex. 92 Mo)
- Aucune gestion d'annulation de rendu

## Historique des changements notables
- [date] - ajout du support importBatchId

## Secteur parent
services/ (./services.md) -> src/ (../src.md) -> Projet ARDA (../../README.md)
```

---

## Niveau 2 - Fiche dossier / secteur (nomDuDossier.md)

Gabarit pour chaque dossier :

```markdown
# Secteur services/

## Role du secteur
Contient les services techniques transverses : acces aux donnees (IndexedDB), rendu cartographique (MapLibre), import de fonds GeoJSON.

## Fichiers du secteur
| Fichier | Role resume | Doc |
|---|---|---|
| geopoliticaImporter.ts | Parsing et normalisation des fonds Geopolitica | ./geopoliticaImporter.md |
| maplibre.ts | Rendu cartographique | ./maplibre.md |
| indexeddb.ts | Persistance locale | ./indexeddb.md |

## Interconnexions avec les autres secteurs
- Utilise par components/ (../components/components.md) (declenchement UI)
- Alimente store/ (../store/store.md) (etat applicatif)

## Position dans l'architecture globale
src/ (../src.md) -> Projet ARDA (../../README.md)
```

---

## Niveau 3 - Vue globale (docs/ARCHITECTURE.md)

Document unique de haut niveau, qui ne detaille pas le code mais cartographie les secteurs :

```markdown
# Architecture Generale - ARDA / Braudel / Tolkien

## Carte des secteurs

| Secteur | Role | Doc |
|---|---|---|
| services/ | Logique technique (import, rendu, persistance) | ../src/services/services.md |
| store/ | Etat applicatif (Zustand) | ../src/store/store.md |
| components/ | Interface utilisateur (React) | ../src/components/components.md |
| registry/ | Declaration des sources de donnees | ../src/registry/registry.md |

## Flux principal (import GeoJSON)
GeopoliticaPanel.tsx -> geopoliticaImporter.ts -> store.ts -> indexeddb.ts -> maplibre.ts

## Diagramme des dependances inter-secteurs

mermaid
graph LR
  components --> services
  services --> store
  store --> services
  registry --> services

```

---

## Niveau 4 - Racine projet (README.md)

Point d'entree unique, avec liens vers docs/ARCHITECTURE.md et vers chaque secteur de premier niveau. Doit rester court (moins d'une page) et pointer vers les niveaux inferieurs plutot que tout expliquer.

---

## Regles de redaction communes

1. Chaque fichier .md doit contenir au minimum : role, emplacement, dependances entrantes, dependances sortantes, position dans la hierarchie (fil d'Ariane en bas de fichier).
2. Les liens sont toujours relatifs, jamais absolus, pour rester valides apres deplacement du depot.
3. Aucun .md ne doit etre une impasse : chaque fiche fichier remonte vers son secteur, chaque secteur remonte vers l'architecture globale.
4. Les dependances transversales (ex. un composant UI qui appelle un service d'un autre secteur) doivent etre documentees dans les deux fiches concernees (symetrie des liens).
5. La dette technique et les points d'attention doivent etre une section obligatoire, pas optionnelle - c'est ce qui rend le wiki utile en pratique, au-dela d'un simple export de commentaires.

---

## Processus de mise en oeuvre

### Phase 1 - Gabarits et outillage
- Creer les 3 gabarits Markdown (fichier, secteur, architecture globale).
- Ecrire un script Node/TS (scripts/generate-doc-stub.ts) qui, pour chaque fichier source sans .md associe, genere un stub pre-rempli (role vide, dependances detectees automatiquement par analyse des import).

### Phase 2 - Generation automatique des dependances
- Utiliser une analyse statique des imports (ex. ts-morph ou madge) pour pre-remplir automatiquement les sections "Dependances entrantes / sortantes" de chaque fiche fichier.
- Generer un graphe de dependances global exploitable pour construire le diagramme Mermaid de ARCHITECTURE.md.

### Phase 3 - Redaction humaine du contenu metier
- Completer manuellement les sections "Role", "Points d'attention" et "Historique" - ce sont les parties non automatisables.
- Prioriser les secteurs critiques identifies precedemment : import GeoJSON, rendu cartographique, gestion du store.

### Phase 4 - Verification d'integrite des liens
- Script de controle (scripts/check-doc-links.ts) qui verifie que chaque .md a bien un lien valide vers son parent et que chaque fichier source possede bien un .md associe (couverture a 100%).
- Integrer ce controle en CI (echec du build si un fichier source est ajoute sans documentation associee).

### Phase 5 - Maintenance continue
- Ajouter une regle de contribution (CONTRIBUTING.md) : toute creation/modification significative d'un fichier source impose la mise a jour de son .md associe dans la meme Pull Request.
- Revue periodique (ex. trimestrielle) des sections "Dette technique" pour verifier qu'elles restent a jour.

---

## Benefices attendus

- Navigation possible directement dans GitHub/GitLab, sans outil externe, de la racine du projet jusqu'a une fonction precise.
- Onboarding facilite pour un nouveau contributeur : README.md -> secteur -> fichier.
- Detection facilitee des dependances circulaires ou du couplage excessif entre secteurs, grace au graphe genere en Phase 2.
- Base reutilisable pour generer une documentation exportable (ex. site statique via MkDocs ou Docusaurus) si le projet grandit.

Construis le lot 16 du projet Braudel, phase d’exportation multimédia et publication.

Objectif :
- implémenter l’export PDF complet de la carte courante, incluant la légende, le titre et l’échelle de manière propre et prête pour l’impression ;
- implémenter l’export JPEG à une date choisie (instantané de la carte) ;
- permettre la capture d’une série chronologique (export en lot d'images JPEG) sur une période de temps donnée (ex: une image par siècle ou par année de l'intervalle sélectionné) sous forme d'archive compressée ;
- implémenter l’export vers un fichier HTML autonome intégrant la carte interactive (avec MapLibre et les données locales encapsulées) permettant un affichage et une exploration dynamique sur n’importe quelle page web.

Contraintes :
- traitement local-first strict (tous les exports PDF/JPEG et génération HTML se font entièrement côté client sans serveur de rendu externe) ;
- conservation de la fidélité des styles de carte (Tolkien & Braudel) et du filtre temporel actif dans les captures d'images ;
- formatage propre et lisible de la légende dans le PDF ;
- performance et feedback visuel (barre de progression) lors des exports en lot d'images sur de grandes périodes temporelles.

Livrables attendus :
- module d'export PDF avec mise en page légende/titre ;
- module d'export JPEG individuel et série temporelle (génération par lot) ;
- générateur de fichier HTML interactif autonome ;
- UI de configuration des exports dans le panneau de données (`DataPanel`) ;
- tests unitaires et de validation sur les pipelines d'exportation.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT

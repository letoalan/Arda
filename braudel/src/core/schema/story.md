# Schéma de Données Story & Scènes (`story.ts`)

Définit les schémas Zod et types TypeScript pour le module de narration cartographique (Storytelling spatial et temporel) :

- **`StorySceneSchema`** : Représente une scène/période du récit avec :
  - `id`: Identifiant unique de la scène
  - `periodNumber`: Numéro de la période ordonnée dans la timeline (ex: 1, 2, ... N)
  - `totalPeriods`: Nombre total de périodes dans la séquence
  - `title`, `body`: Intitulé narratif et descriptif
  - `mapState`: État de caméra (`center`, `zoom`, `bearing`, `pitch`) et année temporelle (`timelineYear`)
  - `transition`: Profil de vol (`StoryCameraTransitionSchema`) avec temporisation narrative post-vol (`pauseAfterMs`)
  - `layout`: Mise en page (`split`, `map-full`, etc.)
  - `blocks`: Blocs de contenu multimédia additionnels
- **`StoryProjectSchema`** : Projet de narration complet (`id`, `title`, `scenes: StoryScene[]`).

## Fil d'Ariane
[core/](../core.md) -> [schema/](./schema.md) -> **story.md**

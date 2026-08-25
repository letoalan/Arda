# Gouvernance & Charte d'Usage — Braudel IA

Ce document définit les règles de gouvernance, de sécurité et d'intégration éthique du modèle local **Braudel IA**.

---

## 1. Principes Directeurs

1. **Local-First & Confidentialité :** Le modèle s'exécute exclusivement en local (via Ollama ou LM Studio) sans transfert de données vers des tiers ou des API cloud propriétaires.
2. **Humain dans la Boucle (Human-in-the-Loop) :** L'IA ne modifie jamais directement la base de données cartographique (`IndexedDB`). Elle soumet des *propositions* sous forme de calques temporaires que l'utilisateur doit réviser et accepter manuellement dans l'UI.
3. **Spécialisation Cartographique :** Le système rejette activement toute tâche hors domaine (ex: questions générales de programmation, politique contemporaine, vie quotidienne) pour optimiser les performances et la sécurité.

---

## 2. Garde-fous Techniques

### Détection & Refus Hors Domaine
Tout message utilisateur ne s'inscrivant pas dans le périmètre fonctionnel défini (génération de mondes, suggestions d'entités/relations, timelines historiques, styles) doit être refusé de manière structurée :
```json
{
  "task": "entity_suggestions",
  "confidence": 0.0,
  "items": [],
  "warnings": ["Requête hors domaine (limité à la cartographie historique/analytique Braudel/ANT)."]
}
```

### Protection contre les injections de prompts (Prompt Injections)
Le runtime local encapsule les instructions de l'utilisateur dans une structure d'invites fermée, séparant les métadonnées système des requêtes textuelles libres.

---

## 3. Contrat d'Intégration Applicative

Le contrat d'échange entre l'application frontend (Arda/Braudel) et le pipeline d'inférence est formalisé comme suit :

### Requête (`IARequest`)
```typescript
interface IARequest {
  task: 'world_seed' | 'entity_suggestions' | 'relation_suggestions' | 'timeline_suggestions' | 'style_suggestions' | 'import_interpretation' | 'edit_operations';
  instruction: string;
  context: {
    worldId?: string;
    currentTime?: number;
    activeLayers?: string[];
    [key: string]: any;
  };
}
```

### Réponse (`IAResponse`)
```typescript
interface IAResponse {
  task: string;
  confidence: number; // 0.0 à 1.0 (0.0 signale un refus ou un échec d'interprétation)
  items: Array<Record<string, any>>;
  warnings: string[];
}
```

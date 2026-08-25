# aiSlice.ts

## Rôle
Gestion des propositions IA et des sessions dans l'état Zustand (acceptation, rejet, bascule d'intégration de sous-entités).

## Emplacement
`src/app/state/aiSlice.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `indexeddb.ts` (../../services/persistence/persistence.md)

## Fonctions Clés
- `handleAcceptAiProposal(state, proposalId)`
- `handleRejectAiProposal(state, proposalId)`
- `handleToggleProposalSubEntity(state, proposalId, subEntityId)`

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

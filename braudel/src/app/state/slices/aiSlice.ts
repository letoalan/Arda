// app/state/slices/aiSlice.ts

import { put } from '../../../services/persistence/indexeddb';

export function handleAcceptAiProposal(state: any, proposalId: string) {
  const proposal = state.aiProposals.find((p: any) => p.id === proposalId);
  if (!proposal) return state;

  const updatedProposals = state.aiProposals.map((p: any) => {
    if (p.id === proposalId) {
      const updated = {
        ...p,
        status: 'accepted' as const,
        acceptedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      };
      put('ai', updated);
      return updated;
    }
    return p;
  });

  return {
    aiProposals: updatedProposals,
    selectedProposal: state.selectedProposal?.id === proposalId ? null : state.selectedProposal,
  };
}

export function handleRejectAiProposal(state: any, proposalId: string, reason?: string) {
  const updatedProposals = state.aiProposals.map((p: any) => {
    if (p.id === proposalId) {
      const updated = {
        ...p,
        status: 'rejected' as const,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      };
      put('ai', updated);
      return updated;
    }
    return p;
  });

  return {
    aiProposals: updatedProposals,
    selectedProposal: state.selectedProposal?.id === proposalId ? null : state.selectedProposal,
  };
}

export function handleToggleProposalSubEntity(state: any, proposalId: string, subId: string) {
  const updatedProposals = state.aiProposals.map((p: any) => {
    if (p.id === proposalId && p.subEntities) {
      return {
        ...p,
        subEntities: p.subEntities.map((sub: any) =>
          sub.id === subId ? { ...sub, selected: sub.selected === false ? true : false } : sub
        ),
      };
    }
    return p;
  });

  return { aiProposals: updatedProposals };
}

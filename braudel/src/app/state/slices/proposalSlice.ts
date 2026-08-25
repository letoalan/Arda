// app/state/slices/proposalSlice.ts

export function handleAddSubEntityToProposal(state: any, proposalId: string, name: string, type: string, geometry?: any) {
  return {
    aiProposals: state.aiProposals.map((p: any) => {
      if (p.id === proposalId) {
        const subEntities = p.subEntities || [];
        return { ...p, subEntities: [...subEntities, { id: crypto.randomUUID(), name, type, geometry, selected: true }] };
      }
      return p;
    }),
  };
}

export function handleUpdateSubEntityInProposal(state: any, proposalId: string, subId: string, updates: Partial<any>) {
  return {
    aiProposals: state.aiProposals.map((p: any) => {
      if (p.id === proposalId && p.subEntities) {
        return { ...p, subEntities: p.subEntities.map((sub: any) => (sub.id === subId ? { ...sub, ...updates } : sub)) };
      }
      return p;
    }),
  };
}

export function handleRemoveSubEntityFromProposal(state: any, proposalId: string, subId: string) {
  return {
    aiProposals: state.aiProposals.map((p: any) => {
      if (p.id === proposalId && p.subEntities) {
        return { ...p, subEntities: p.subEntities.filter((sub: any) => sub.id !== subId) };
      }
      return p;
    }),
  };
}

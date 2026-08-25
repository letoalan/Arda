import { z } from 'zod';

export const aiTaskSchema = z.enum([
  'generateEntity',
  'generateRelation',
  'summarizeData',
  'analyzeNetwork',
  'proposeStyle',
  'suggestName',
  'validateStructure',
  'import_interpretation',
]);

export const aiProposalStatusSchema = z.enum(['pending', 'accepted', 'rejected']);

export const aiProposalTypeSchema = z.enum([
  'addEntity',
  'removeEntity',
  'updateEntity',
  'addRelation',
  'removeRelation',
  'updateStyle',
  'modifyLayer',
]);

export const aiValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export const aiSessionSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string(),
  task: aiTaskSchema,
  instruction: z.string(),
  context: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const aiSubEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  geometry: z.record(z.unknown()).optional(),
  selected: z.boolean().default(true),
  properties: z.record(z.unknown()).optional(),
});

export const aiProposalSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  worldId: z.string(),
  type: aiProposalTypeSchema,
  data: z.record(z.unknown()),
  subEntities: z.array(aiSubEntitySchema).optional(),
  status: aiProposalStatusSchema,
  confidence: z.number().min(0).max(1),
  validation: aiValidationResultSchema.optional(),
  createdAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
});

export const aiResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  output: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    model: z.string(),
    timestamp: z.string().datetime(),
    processingTimeMs: z.number().optional(),
  }),
});

export const aiSessionWithProposalsSchema = aiSessionSchema.extend({
  proposals: z.array(aiProposalSchema).default([]),
});

export const aiSchema = z.object({});

export type AiTask = z.infer<typeof aiTaskSchema>;
export type AiProposalStatus = z.infer<typeof aiProposalStatusSchema>;
export type AiProposalType = z.infer<typeof aiProposalTypeSchema>;
export type AiValidationResult = z.infer<typeof aiValidationResultSchema>;
export type AiSubEntity = z.infer<typeof aiSubEntitySchema>;
export type AiSession = z.infer<typeof aiSessionSchema>;
export type AiProposal = z.infer<typeof aiProposalSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;
export type AiSessionWithProposals = z.infer<typeof aiSessionWithProposalsSchema>;

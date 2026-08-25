import { z } from 'zod';

export const wikiLinkSchema = z.object({
  rawText: z.string(),
  targetName: z.string(),
  targetEntityId: z.string().optional(),
  isBroken: z.boolean().default(false)
});

export type WikiLink = z.infer<typeof wikiLinkSchema>;

export const wikiPageSchema = z.object({
  entityId: z.string(),
  title: z.string().min(1),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  outgoingLinks: z.array(wikiLinkSchema).default([])
});

export type WikiPage = z.infer<typeof wikiPageSchema>;

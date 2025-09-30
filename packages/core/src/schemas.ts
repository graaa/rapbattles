import { z } from 'zod';

// Battle schemas
export const BattleStatusSchema = z.enum(['scheduled', 'open', 'closed']);
export type BattleStatus = z.infer<typeof BattleStatusSchema>;

export const BattleSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  mc_a: z.string(),
  mc_b: z.string(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  status: BattleStatusSchema,
});
export type Battle = z.infer<typeof BattleSchema>;

// Vote schemas
export const VoteChoiceSchema = z.enum(['A', 'B']);
export type VoteChoice = z.infer<typeof VoteChoiceSchema>;

export const VoteRequestSchema = z.object({
  battle_id: z.string().uuid(),
  choice: VoteChoiceSchema,
  device_hash: z.string().min(1),
});
export type VoteRequest = z.infer<typeof VoteRequestSchema>;

export const VoteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tally: z.object({
    A: z.number(),
    B: z.number(),
  }).optional(),
});
export type VoteResponse = z.infer<typeof VoteResponseSchema>;

// Tally schemas
export const TallySchema = z.object({
  A: z.number(),
  B: z.number(),
});
export type Tally = z.infer<typeof TallySchema>;

// Admin schemas
export const AdminOpenBattleSchema = z.object({
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
});
export type AdminOpenBattle = z.infer<typeof AdminOpenBattleSchema>;

// Error schemas
export const ErrorResponseSchema = z.object({
  detail: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

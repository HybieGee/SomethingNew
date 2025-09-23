import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(50),
  solanaAddress: z.string().min(32).max(44)
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const CompleteQuestSchema = z.object({
  questSlug: z.string(),
  choice: z.string().optional(),
  score: z.number().optional(),
  answers: z.array(z.string()).optional()
});

export const EnterRaffleSchema = z.object({
  raffleId: z.string(),
  tickets: z.number().min(1)
});

export const PurchaseItemSchema = z.object({
  itemId: z.string()
});

export const UpdateAddressSchema = z.object({
  solanaAddress: z.string().min(32).max(44)
});

export const AdminClaimSchema = z.object({
  tx: z.string(),
  amount: z.number(),
  token: z.string(),
  split: z.object({
    seasonPool: z.number(),
    raffles: z.number(),
    boost: z.number()
  })
});

export const AdminBoostSchema = z.object({
  multiplier: z.number().min(1.1).max(5),
  startMs: z.number(),
  endMs: z.number()
});

export const AdminDrawSchema = z.object({
  raffleId: z.string()
});
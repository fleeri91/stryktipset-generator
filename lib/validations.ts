import { z } from 'zod'

export const createSessionSchema = z.object({
  hostName: z.string().min(1, 'Namn krävs').max(20, 'Max 20 tecken').trim(),
  eventType: z.string().min(1),
  drawNumber: z.number().int(),
  closeTime: z.string(),
  matches: z
    .array(
      z.object({
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
        league: z.string().min(1),
        kickoff: z.string(),
      })
    )
    .min(1, 'Minst en match krävs')
    .max(13, 'Max 13 matcher'),
})

export const joinSessionSchema = z.object({
  name: z.string().min(1, 'Namn krävs').max(20, 'Max 20 tecken').trim(),
})

export const submitSelectionsSchema = z.object({
  selections: z
    .array(
      z
        .object({
          matchIndex: z.number().int().min(1).max(13),
          home: z.boolean(),
          draw: z.boolean(),
          away: z.boolean(),
          firstChoice: z.enum(['home', 'draw', 'away']),
        })
        .refine((s) => s[s.firstChoice] === true, {
          message: 'firstChoice måste vara ett valt alternativ',
        })
        .refine((s) => [s.home, s.draw, s.away].filter(Boolean).length <= 2, {
          message: 'Max 2 val per match',
        })
    )
    .min(1)
    .refine(
      (selections) => selections.every((s) => s.home || s.draw || s.away),
      { message: 'Varje match måste ha minst ett val' }
    ),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type JoinSessionInput = z.infer<typeof joinSessionSchema>
export type SubmitSelectionsInput = z.infer<typeof submitSelectionsSchema>

import Decimal from 'decimal.js'
import { z } from 'zod'

import { choiceIsEmpty } from '../choice'
import { decimalSchema } from './decimal'

export const voteSchema = z.object({
  proposal: z.string().min(1),
  choice: z
    .string()
    .refine(
      (choice) =>
        !choiceIsEmpty('single', choice) && !choiceIsEmpty('approval', choice),
      { message: 'Empty choice' },
    ),
  power: decimalSchema.refine((power) => new Decimal(power).gt(0), {
    message: 'Negative power not allowed',
  }),
})

export type Vote = z.infer<typeof voteSchema>

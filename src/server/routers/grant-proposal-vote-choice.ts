import { Decimal } from 'decimal.js'
import { TRPCError } from '@trpc/server'
import { keyBy, mapValues } from 'lodash-es'
import { z } from 'zod'

import { database } from '../../utils/database'
import { procedure, router } from '../trpc'

export const grantProposalVoteChoiceRouter = router({
  get: procedure
    .input(
      z.object({
        grantProposal: z.string().optional(),
        option: z.string().optional(),
      }),
    )
    .output(z.object({ power: z.string() }))
    .query(async ({ input }) => {
      if (!input.grantProposal || !input.option) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const choice = await database.grantProposalVoteChoice.findUnique({
        where: {
          proposalPermalink_option: {
            proposalPermalink: input.grantProposal,
            option: input.option,
          },
        },
      })

      return {
        power: choice?.power.toString() || '0',
      }
    }),
  grantByProposal: procedure
    .input(z.object({ grantProposal: z.string().optional() }))
    .output(
      z.object({ powers: z.record(z.string(), z.string()), total: z.string() }),
    )
    .query(async ({ input }) => {
      if (!input.grantProposal) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const choices = await database.grantProposalVoteChoice.findMany({
        where: { proposalPermalink: input.grantProposal },
      })

      return {
        powers: mapValues(
          keyBy(choices, ({ option }) => option),
          ({ power }) => power.toString(),
        ),
        total: choices
          .reduce((total, choice) => total.add(choice.power), new Decimal(0))
          .toString(),
      }
    }),
})

export type GrantProposalVoteChoiceRouter = typeof grantProposalVoteChoiceRouter

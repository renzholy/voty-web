import { TRPCError } from '@trpc/server'
import { compact, keyBy, last, mapValues } from 'lodash-es'
import { z } from 'zod'

import { upload } from '../../utils/arweave'
import { database } from '../../utils/database'
import { voteWithAuthorSchema } from '../../utils/schemas'
import verifyVote from '../../utils/verifiers/verify-vote'
import { powerOfChoice } from '../../utils/voting'
import { procedure, router } from '../trpc'

const textDecoder = new TextDecoder()

const jwk = JSON.parse(process.env.ARWEAVE_KEY_FILE!)

export const voteRouter = router({
  list: procedure
    .input(
      z.object({
        proposal: z.string().nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          voteWithAuthorSchema.merge(z.object({ permalink: z.string() })),
        ),
        next: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.proposal) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      const votes = await database.vote.findMany({
        cursor: input.cursor ? { permalink: input.cursor } : undefined,
        where: { proposal: input.proposal },
        take: 50,
        orderBy: { ts: 'desc' },
      })
      return {
        data: compact(
          votes.map(({ permalink, data }) => {
            try {
              return {
                permalink,
                ...voteWithAuthorSchema.parse(
                  JSON.parse(textDecoder.decode(data)),
                ),
              }
            } catch {
              return
            }
          }),
        ),
        next: last(votes)?.permalink,
      }
    }),
  groupByProposal: procedure
    .input(
      z.object({
        proposal: z.string().nullish(),
        authors: z.array(z.string()).nullish(),
      }),
    )
    .output(z.record(z.string(), z.number()))
    .query(async ({ input }) => {
      if (!input.proposal) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      if (!input.authors) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      const votes = await database.vote.findMany({
        where: {
          proposal: input.proposal,
          author: { in: input.authors },
        },
      })
      return mapValues(
        keyBy(votes, ({ author }) => author),
        ({ data }) =>
          voteWithAuthorSchema.parse(JSON.parse(textDecoder.decode(data)))
            .power,
      )
    }),
  create: procedure.input(voteWithAuthorSchema).mutation(async ({ input }) => {
    const { vote, proposal } = await verifyVote(input)
    const { permalink, data } = await upload(vote, jwk)
    const ts = new Date()

    await database.$transaction([
      database.vote.create({
        data: {
          permalink,
          ts,
          author: vote.author.did,
          community: proposal.community,
          group: proposal.group,
          proposal: vote.proposal,
          data,
        },
      }),
      database.proposal.update({
        where: { permalink: vote.proposal },
        data: { votes: { increment: 1 } },
      }),
      ...Object.entries(
        powerOfChoice(proposal.voting_type, vote.choice, vote.power),
      ).map(([option, power = 0]) =>
        database.choice.upsert({
          where: {
            proposal_option: { proposal: vote.proposal, option },
          },
          create: {
            proposal: vote.proposal,
            option,
            power,
          },
          update: {
            power: { increment: power },
          },
        }),
      ),
    ])
  }),
})

export type VoteRouter = typeof voteRouter
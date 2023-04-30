import { TRPCError } from '@trpc/server'
import { compact, keyBy, last } from 'lodash-es'
import { z } from 'zod'

import { uploadToArweave } from '../../utils/upload'
import { database } from '../../utils/database'
import { authorized } from '../../utils/schemas/authorship'
import { grantSchema } from '../../utils/schemas/grant'
import { procedure, router } from '../trpc'
import { proved } from '../../utils/schemas/proof'
import verifySnapshot from '../../utils/verifiers/verify-snapshot'
import verifyAuthorship from '../../utils/verifiers/verify-authorship'
import verifyProof from '../../utils/verifiers/verify-proof'
import verifyGrant from '../../utils/verifiers/verify-grant'
import { GrantPhase } from '../../utils/phase'

const schema = proved(authorized(grantSchema))

export const grantRouter = router({
  getByPermalink: procedure
    .input(z.object({ permalink: z.string().optional() }))
    .output(schema.nullable())
    .query(async ({ input }) => {
      if (!input.permalink) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const storage = await database.storage.findUnique({
        where: { permalink: input.permalink },
      })

      return storage ? schema.parse(storage.data) : null
    }),
  listByCommunityId: procedure
    .input(
      z.object({
        communityId: z.string().optional(),
        phase: z
          .enum([
            GrantPhase.CONFIRMING,
            GrantPhase.ANNOUNCING,
            GrantPhase.PROPOSING,
            GrantPhase.VOTING,
            GrantPhase.ENDED,
          ])
          .optional(),
        cursor: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          schema.extend({
            permalink: z.string(),
            proposals: z.number(),
            ts: z.date(),
            tsAnnouncing: z.date().nullable(),
            tsProposing: z.date().nullable(),
            tsVoting: z.date().nullable(),
          }),
        ),
        next: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.communityId) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const now = new Date()
      const filter =
        input.phase === GrantPhase.CONFIRMING
          ? { tsAnnouncing: null, tsVoting: null }
          : input.phase === GrantPhase.ANNOUNCING
          ? { ts: { lte: now }, tsAnnouncing: { gt: now } }
          : input.phase === GrantPhase.PROPOSING
          ? { tsAnnouncing: { lte: now }, tsProposing: { gt: now } }
          : input.phase === GrantPhase.VOTING
          ? { tsProposing: { lte: now }, tsVoting: { gt: now } }
          : input.phase === GrantPhase.ENDED
          ? { tsVoting: { lte: now } }
          : {}
      const grants = await database.grant.findMany({
        where: { communityId: input.communityId, ...filter },
        cursor: input.cursor ? { permalink: input.cursor } : undefined,
        take: 20,
        skip: input.cursor ? 1 : 0,
        orderBy: { ts: 'desc' },
      })
      const storages = keyBy(
        await database.storage.findMany({
          where: {
            permalink: { in: grants.map(({ permalink }) => permalink) },
          },
        }),
        ({ permalink }) => permalink,
      )

      return {
        data: compact(
          grants
            .filter(({ permalink }) => storages[permalink])
            .map(
              ({
                permalink,
                proposals,
                ts,
                tsAnnouncing,
                tsProposing,
                tsVoting,
              }) => {
                try {
                  return {
                    ...schema.parse(storages[permalink].data),
                    permalink,
                    proposals,
                    ts,
                    tsAnnouncing,
                    tsProposing,
                    tsVoting,
                  }
                } catch {
                  return
                }
              },
            ),
        ),
        next: last(grants)?.permalink,
      }
    }),
  create: procedure
    .input(schema)
    .output(z.string())
    .mutation(async ({ input }) => {
      await verifySnapshot(input.authorship)
      await verifyProof(input)
      await verifyAuthorship(input.authorship, input.proof)
      const { community } = await verifyGrant(input)

      const permalink = await uploadToArweave(input)
      const ts = new Date()

      await database.$transaction([
        database.grant.create({
          data: {
            permalink,
            communityId: community.id,
            communityPermalink: input.community,
            ts,
          },
        }),
        database.community.update({
          where: { id: community.id },
          data: { grants: { increment: 1 } },
        }),
        database.storage.create({ data: { permalink, data: input } }),
      ])

      return permalink
    }),
})

export type GrantRouter = typeof grantRouter

import { keyBy, sumBy } from 'lodash-es'
import { NextApiRequest, NextApiResponse } from 'next'

import { database } from '../../src/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const query = req.query as {
    proposal: string
  }

  const data = await database.counting.findMany({
    where: {
      proposal: query.proposal,
    },
  })

  res.json({
    counting: keyBy(data, ({ choice }) => choice),
    power: sumBy(data, ({ power }) => power),
  })
}

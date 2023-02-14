import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { Authorized, Community, Proposal, Option, Vote } from '../utils/schemas'
import { Turnout } from '../utils/types'
import { fetchJson } from '../utils/fetcher'

export function useGroup(community?: Community, group?: string) {
  return useMemo(
    () => community?.groups?.find((g) => g.extension.id === group),
    [community?.groups, group],
  )
}

export function useTurnout(proposal?: string) {
  return useSWR(
    proposal ? ['turnout', proposal] : null,
    async () => fetchJson<Turnout>(`/api/turnout?proposal=${proposal}`),
    { revalidateOnFocus: false },
  )
}

export function useUpload<
  T extends Authorized<Community | Proposal | Option | Vote>,
>() {
  return useCallback(async (document: T) => {
    const textEncoder = new TextEncoder()
    const body = textEncoder.encode(JSON.stringify(document))
    const { permalink } = await fetchJson<{ permalink: string }>(
      '/api/upload',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      },
    )
    return permalink
  }, [])
}

import { useCallback } from 'react'

import { Organization, Proposal, Signature } from '../src/schemas'
import { SignatureAction, wrapJsonMessage } from '../src/signature'
import { SignatureUnit } from '../src/types'
import useCurrentSnapshot from './use-current-snapshot'
import useSignMessage from './use-sign-message'

export default function useSignJson<T extends Organization | Proposal>(
  did: string,
  action: SignatureAction,
  signatureUnit?: SignatureUnit,
): (a: T) => Promise<(T & { signature: Signature }) | undefined> {
  const signMessage = useSignMessage(signatureUnit?.coinType)
  const { data: snapshot } = useCurrentSnapshot(signatureUnit?.coinType)

  return useCallback(
    async (json: T) => {
      if (!snapshot || !signatureUnit) {
        return
      }
      const data = await signMessage(await wrapJsonMessage(action, json))
      return {
        ...json,
        signature: {
          did,
          snapshot: snapshot.toString(),
          coin_type: signatureUnit.coinType,
          address: signatureUnit.address,
          data,
        },
      }
    },
    [snapshot, signatureUnit, signMessage, action, did],
  )
}

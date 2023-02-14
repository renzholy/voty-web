export type DID<S extends 'bit' | 'eth' = string> = `${string}.${S}`

export type DidResolver<S extends 'bit' | 'eth' = string> = (
  did: DID<S> | string,
  snapshots: Snapshots,
) => Promise<Account>

export type Snapshots = { [coinType: number]: bigint }

export type Proof = `${number}:${string}`

export type Account = {
  coinType: number
  address: string
}

export type Status = {
  timestamp?: number
  // revoked?: number
}

export type Turnout = {
  powers: { [option: string]: number }
  total: number
}
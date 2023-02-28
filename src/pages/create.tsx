import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

import Button from '../components/basic/button'
import Combobox from '../components/basic/combobox'
import LoadingBar from '../components/basic/loading-bar'
import TextButton from '../components/basic/text-button'
import useDids from '../hooks/use-dids'
import useWallet from '../hooks/use-wallet'
import { documentTitle, isTestnet } from '../utils/constants'
import { trpc } from '../utils/trpc'

export default function CreateCommunityPage() {
  const { account } = useWallet()
  const { data } = useDids(account)
  const [entry, setEntry] = useState('')
  const dids = useMemo(
    () => data?.filter((did) => did.indexOf('.') === did.lastIndexOf('.')),
    [data],
  )
  const { data: existences, isLoading } =
    trpc.community.checkExistences.useQuery(
      { entries: dids },
      { enabled: !!dids?.length, refetchOnWindowFocus: false },
    )
  const options = useMemo(
    () =>
      existences && dids
        ? dids.map((did) => ({ did, disabled: existences[did] }))
        : undefined,
    [dids, existences],
  )
  useEffect(() => {
    setEntry(options?.find(({ disabled }) => !disabled)?.did || '')
  }, [options])

  return (
    <>
      <Head>
        <title>{`Create community - ${documentTitle}`}</title>
      </Head>
      <LoadingBar loading={isLoading} />
      <div className="w-full bg-white">
        <div className="py-24 sm:px-6 sm:py-32">
          <div className="mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">
              Create a community
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              {dids?.length === 0
                ? 'You need a DID to create community'
                : 'to hear valuable voices from your community members'}
            </p>
            <div className="mt-10 flex flex-col items-center space-y-6">
              {options?.length === 0 ? (
                <a
                  href={
                    isTestnet
                      ? 'https://test2f7a872b.did.id/explorer'
                      : 'https://app.did.id/explorer'
                  }
                >
                  <Button icon={ArrowTopRightOnSquareIcon} primary>
                    Register
                  </Button>
                </a>
              ) : (
                <>
                  <Combobox
                    label="Select a DID as your community entry"
                    options={options}
                    value={entry}
                    onChange={setEntry}
                  />

                  <TextButton
                    href={`/${entry}/settings`}
                    primary
                    disabled={isLoading}
                  >
                    Next →
                  </TextButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useCallback, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { compact } from 'lodash-es'
import Head from 'next/head'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'

import useGroup from '../../../hooks/use-group'
import { DetailItem, DetailList } from '../../../components/basic/detail'
import { trpc } from '../../../utils/trpc'
import Article from '../../../components/basic/article'
import TextButton from '../../../components/basic/text-button'
import LoadingBar from '../../../components/basic/loading-bar'
import {
  coinTypeExplorers,
  coinTypeNames,
  documentTitle,
} from '../../../utils/constants'
import useRouterQuery from '../../../hooks/use-router-query'
import Markdown from '../../../components/basic/markdown'
import Button from '../../../components/basic/button'
import { PlusIcon } from '@heroicons/react/20/solid'
import { permalink2Id } from '../../../utils/permalink'
import OptionCard from '../../../components/option-card'
import { getPeriod, Period } from '../../../utils/period'
import useStatus from '../../../hooks/use-status'

const StatusIcon = dynamic(() => import('../../../components/status-icon'), {
  ssr: false,
})

const ProposalSchedule = dynamic(
  () => import('../../../components/proposal-schedule'),
  {
    ssr: false,
    loading: () => (
      <DetailList title="Schedule">
        <DetailItem title="Period">{null}</DetailItem>
        <DetailItem title="Voting start">...</DetailItem>
        <DetailItem title="Voting end">...</DetailItem>
      </DetailList>
    ),
  },
)

export default function RoundPage() {
  const query = useRouterQuery<['proposal']>()
  const { data: proposal, isLoading } = trpc.proposal.getByPermalink.useQuery(
    { permalink: query.proposal },
    { enabled: !!query.proposal, refetchOnWindowFocus: false },
  )
  const { data: community, isLoading: isCommunityLoading } =
    trpc.community.getByPermalink.useQuery(
      { permalink: proposal?.community },
      { enabled: !!proposal?.community, refetchOnWindowFocus: false },
    )
  const group = useGroup(community, proposal?.group, 'grant')
  const { data: status } = useStatus(query.proposal)
  const period = useMemo(
    () => getPeriod(new Date(), status?.timestamp, group?.duration),
    [group?.duration, status?.timestamp],
  )
  const renderCard = useCallback(
    (className?: string) => (
      <div
        className={clsx(
          'relative mt-[-1px] w-full shrink-0 sm:sticky sm:top-18 sm:w-80 sm:pt-8',
          className,
        )}
      >
        <StatusIcon
          permalink={query.proposal}
          className="absolute right-4 top-4 sm:top-12"
        />
        <div className="space-y-6 rounded border border-gray-200 p-6">
          <DetailList title="Information">
            <DetailItem
              title="Community"
              className="truncate whitespace-nowrap"
            >
              {community?.name || '...'}
            </DetailItem>
            <DetailItem title="Grant" className="truncate whitespace-nowrap">
              {group?.name || '...'}
            </DetailItem>
            <DetailItem title="Investor" className="truncate whitespace-nowrap">
              {proposal?.authorship.author || '...'}
            </DetailItem>
          </DetailList>
          <ProposalSchedule
            proposal={query.proposal}
            duration={group?.duration}
          />
          {proposal?.snapshots ? (
            <DetailList title="Snapshots">
              {Object.entries(proposal.snapshots).map(
                ([coinType, snapshot]) => (
                  <DetailItem
                    key={coinType}
                    title={coinTypeNames[parseInt(coinType)] || coinType}
                  >
                    <TextButton
                      href={`${
                        coinTypeExplorers[parseInt(coinType)]
                      }${snapshot}`}
                    >
                      {snapshot}
                    </TextButton>
                  </DetailItem>
                ),
              )}
            </DetailList>
          ) : null}
          <DetailList title="Funding">
            <Article small className="pt-2">
              <ul>
                {proposal?.extension?.funding?.map((funding, index) => (
                  <li key={index}>
                    {funding[0]}&nbsp;
                    <span className="text-gray-400">X</span>&nbsp;
                    {funding[1]}
                  </li>
                ))}
              </ul>
            </Article>
          </DetailList>
        </div>
      </div>
    ),
    [community?.name, proposal, query.proposal, group],
  )
  const title = useMemo(
    () =>
      compact([
        proposal?.title,
        group?.name,
        community?.name,
        documentTitle,
      ]).join(' - '),
    [community?.name, proposal?.title, group?.name],
  )
  const { data, hasNextPage, fetchNextPage } =
    trpc.option.list.useInfiniteQuery(
      { proposal: query.proposal },
      { enabled: !!query.proposal, getNextPageParam: ({ next }) => next },
    )
  const options = useMemo(() => data?.pages.flatMap(({ data }) => data), [data])
  const { ref, inView } = useInView()
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, inView])

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="w-full">
        <LoadingBar loading={isLoading || isCommunityLoading} />
        <div className="flex w-full flex-1 flex-col items-start sm:flex-row">
          <div className="w-full flex-1 pt-6 sm:mr-10 sm:w-0 sm:pt-8">
            <TextButton
              disabled={!community || !group}
              href={`/${community?.authorship.author}/${group?.id}`}
            >
              <h2 className="text-[1rem] font-semibold leading-6">← Back</h2>
            </TextButton>
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="mt-4 break-words text-3xl font-bold leading-8 tracking-tight text-gray-900 line-clamp-2 sm:text-4xl">
                {proposal?.title || '...'}
              </h3>
              <Article className="mt-6 sm:mt-8">
                <Markdown>{proposal?.extension?.content}</Markdown>
              </Article>
            </div>
            {renderCard('block sm:hidden mb-6')}
            {query.proposal && period === Period.PROPOSING ? (
              <Link href={`/round/${permalink2Id(query.proposal)}/create`}>
                <Button icon={PlusIcon} primary className="float-right -mt-1">
                  Proposal
                </Button>
              </Link>
            ) : null}
            {proposal?.options_count ? (
              <h2 className="my-6 text-2xl font-bold">
                {proposal.options_count === 1
                  ? '1 Proposal'
                  : `${proposal.options_count} Proposals`}
              </h2>
            ) : null}
            <ul role="list" className="mt-5 space-y-5">
              {options?.map((option) => (
                <li key={option.permalink}>
                  <OptionCard option={option} />
                </li>
              ))}
            </ul>
            <div ref={ref} />
          </div>
          {renderCard('hidden sm:block')}
        </div>
      </div>
    </>
  )
}
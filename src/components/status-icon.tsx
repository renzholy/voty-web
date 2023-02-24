import { CubeIcon, CubeTransparentIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { ReactNode, useId, useMemo } from 'react'

import useStatus from '../hooks/use-status'
import { permalink2Explorer, permalink2Url } from '../utils/permalink'
import TextButton from './basic/text-button'

const Tooltip = dynamic(
  () => import('react-tooltip').then(({ Tooltip }) => Tooltip),
  { ssr: false },
)

export default function StatusIcon(props: {
  permalink?: string
  className?: string
  children?: ReactNode
}) {
  const { data: status, isLoading } = useStatus(props.permalink)
  const children = useMemo(
    () =>
      props.children ??
      (isLoading ? null : status?.timestamp ? (
        <CubeIcon className="h-5 w-5" />
      ) : (
        <CubeTransparentIcon className="h-5 w-5" />
      )),
    [isLoading, props.children, status?.timestamp],
  )
  const href = useMemo(
    () =>
      props.permalink
        ? status?.timestamp
          ? permalink2Explorer(props.permalink)
          : permalink2Url(props.permalink)
        : undefined,
    [props.permalink, status?.timestamp],
  )
  const id = useId()

  return props.permalink ? (
    <>
      <a
        href={href}
        data-tooltip-id={id}
        data-tooltip-place="left"
        className={props.className}
      >
        <TextButton className="w-full truncate">{children}</TextButton>
      </a>
      <Tooltip id={id} className="rounded">
        Transaction {status?.timestamp ? 'confirmed' : 'pending'}
      </Tooltip>
    </>
  ) : null
}

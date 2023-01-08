import Link from 'next/link'
import { Button } from 'react-daisyui'

import { useList } from '../hooks/use-api'
import { DataType } from '../src/constants'
import { OrganizationWithSignature } from '../src/schemas'

export default function IndexPage() {
  const { data: organizations } = useList<OrganizationWithSignature>(
    DataType.ORGANIZATION,
  )

  return (
    <>
      <Link href="/create">
        <Button color="primary">Create an Organization</Button>
      </Link>
      <ul>
        {organizations?.map((organization) => (
          <li key={organization.did}>
            <Link href={`/${organization.did}`}>{organization.did}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}

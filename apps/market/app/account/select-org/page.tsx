import Link from 'next/link'
import { OrganizationList } from '@clerk/nextjs'

export default function SelectOrgPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string }
}) {
  const redirectUrl = searchParams.redirect_url ?? '/'
  return (
    <div>
      <h1>Select an organization</h1>
      <p>
        BRIET sells books to institutions, so orders are scoped to your
        organization (usually your library). Pick an existing one or create a
        new one to continue. If you don&apos;t see the organization you expect,
        email <a href="mailto:help@briet.app">help@briet.app</a>.
      </p>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl={redirectUrl}
        afterCreateOrganizationUrl={redirectUrl}
      />
      <p><Link href={redirectUrl}>← Back</Link></p>
    </div>
  )
}

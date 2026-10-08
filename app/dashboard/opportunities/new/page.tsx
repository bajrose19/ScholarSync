import { redirect } from 'next/navigation'
import { NewOpportunityForm } from '@/components/opportunities/new-opportunity-form'
import { getViewer } from '@/lib/data'

export default async function NewOpportunityPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'professor') redirect('/dashboard')

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <NewOpportunityForm professorId={profile.id} />
    </div>
  )
}

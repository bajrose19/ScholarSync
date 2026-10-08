import { redirect } from 'next/navigation'
import { ExploreOpportunities } from '@/components/dashboard/explore-opportunities'
import { getViewer, listOpenOpportunities, listSavedIds } from '@/lib/data'

export default async function ExplorePage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'student') redirect('/dashboard')

  return (
    <ExploreOpportunities
      opportunities={listOpenOpportunities()}
      savedIds={listSavedIds(profile.id)}
      studentProfile={profile.student_profiles}
    />
  )
}

import { redirect } from 'next/navigation'
import { SavedOpportunities } from '@/components/dashboard/saved-opportunities'
import { getViewer, listSavedOpportunities } from '@/lib/data'

export default async function SavedPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'student') redirect('/dashboard')

  return (
    <SavedOpportunities
      opportunities={listSavedOpportunities(profile.id)}
      studentProfile={profile.student_profiles}
    />
  )
}

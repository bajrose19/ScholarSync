import { redirect, notFound } from 'next/navigation'
import { OpportunityDetail } from '@/components/opportunities/opportunity-detail'
import {
  getOpportunity,
  getStudentApplication,
  getViewer,
  isOpportunitySaved,
  listApplicationsForOpportunity,
} from '@/lib/data'

interface OpportunityPageProps {
  params: Promise<{ id: string }>
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { id } = await params
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  const opportunity = getOpportunity(id)
  if (!opportunity) notFound()

  const isStudent = profile.role === 'student'
  const existingApplication = isStudent ? getStudentApplication(id, profile.id) : null
  const isSaved = isStudent ? isOpportunitySaved(profile.id, id) : false
  const isOwner = opportunity.professor_id === profile.id
  const applications = isOwner ? listApplicationsForOpportunity(id) : []

  return (
    <OpportunityDetail
      opportunity={opportunity}
      profile={profile}
      studentProfile={profile.student_profiles}
      existingApplication={existingApplication}
      isSaved={isSaved}
      isOwner={isOwner}
      applications={applications}
    />
  )
}

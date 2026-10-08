import { redirect } from 'next/navigation'
import { StudentApplications } from '@/components/dashboard/student-applications'
import { ProfessorApplications } from '@/components/dashboard/professor-applications'
import {
  getViewer,
  listApplicationsForProfessor,
  listProfessorOpportunitySummaries,
  listStudentApplications,
} from '@/lib/data'

export default async function ApplicationsPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  if (profile.role === 'student') {
    return <StudentApplications applications={listStudentApplications(profile.id)} />
  }

  return (
    <ProfessorApplications
      applications={listApplicationsForProfessor(profile.id)}
      opportunities={listProfessorOpportunitySummaries(profile.id)}
    />
  )
}

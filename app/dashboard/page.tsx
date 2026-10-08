import { redirect } from 'next/navigation'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { ProfessorDashboard } from '@/components/dashboard/professor-dashboard'
import {
  getViewer,
  listApplicationsForProfessor,
  listOpenOpportunities,
  listProfessorOpportunities,
  listSavedIds,
  listStudentApplications,
} from '@/lib/data'

export default async function DashboardPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  if (profile.role === 'student') {
    return (
      <StudentDashboard
        profile={profile}
        studentProfile={profile.student_profiles}
        opportunities={listOpenOpportunities().slice(0, 20)}
        savedIds={listSavedIds(profile.id)}
        applications={listStudentApplications(profile.id).slice(0, 5)}
      />
    )
  }

  return (
    <ProfessorDashboard
      profile={profile}
      professorProfile={profile.professor_profiles}
      opportunities={listProfessorOpportunities(profile.id)}
      applications={listApplicationsForProfessor(profile.id).slice(0, 10)}
    />
  )
}

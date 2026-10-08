import { redirect } from 'next/navigation'
import { ProfileSetupForm } from '@/components/profile/profile-setup-form'
import { getViewer } from '@/lib/data'

export default async function ProfileSetupPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  const hasStudentProfile = profile.student_profiles && (
    profile.student_profiles.skills.length > 0 ||
    profile.student_profiles.interests.length > 0
  )
  const hasProfessorProfile = profile.professor_profiles &&
    profile.professor_profiles.research_areas.length > 0

  if ((profile.role === 'student' && hasStudentProfile) || (profile.role === 'professor' && hasProfessorProfile)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <ProfileSetupForm
        email={profile.email}
        initialRole={profile.role}
        initialFullName={profile.full_name || ''}
        initialUniversity={profile.university || ''}
      />
    </div>
  )
}

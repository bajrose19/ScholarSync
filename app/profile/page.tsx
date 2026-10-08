import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/profile/profile-view'
import { getViewer } from '@/lib/data'

export default async function ProfilePage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  const studentProfile = profile.student_profiles
  const professorProfile = profile.professor_profiles

  if (profile.role === 'student' && (!studentProfile?.skills?.length && !studentProfile?.interests?.length)) {
    redirect('/profile/setup')
  }
  if (profile.role === 'professor' && !professorProfile?.research_areas?.length) {
    redirect('/profile/setup')
  }

  return (
    <ProfileView
      profile={profile}
      studentProfile={studentProfile}
      professorProfile={professorProfile}
      isOwnProfile={true}
    />
  )
}

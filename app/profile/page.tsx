import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileView } from '@/components/profile/profile-view'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, student_profiles(*), professor_profiles(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/profile/setup')
  }

  const role = profile.role as 'student' | 'professor'
  const studentProfile = profile.student_profiles
  const professorProfile = profile.professor_profiles

  // Check if profile is incomplete
  if (role === 'student' && (!studentProfile?.skills?.length && !studentProfile?.interests?.length)) {
    redirect('/profile/setup')
  }
  if (role === 'professor' && !professorProfile?.research_areas?.length) {
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

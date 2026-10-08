import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSetupForm } from '@/components/profile/profile-setup-form'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check if profile already exists and is complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, student_profiles(*), professor_profiles(*)')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'
  const hasStudentProfile = profile?.student_profiles && (
    profile.student_profiles.skills?.length > 0 || 
    profile.student_profiles.interests?.length > 0
  )
  const hasProfessorProfile = profile?.professor_profiles && (
    profile.professor_profiles.research_areas?.length > 0
  )

  // If profile is complete, redirect to dashboard
  if ((role === 'student' && hasStudentProfile) || (role === 'professor' && hasProfessorProfile)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <ProfileSetupForm 
        userId={user.id}
        email={user.email || ''}
        initialRole={role as 'student' | 'professor'}
        initialFullName={profile?.full_name || user.user_metadata?.full_name || ''}
        initialUniversity={profile?.university || user.user_metadata?.university || ''}
      />
    </div>
  )
}

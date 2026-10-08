import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <div className="min-h-screen bg-background">
      <DashboardNav 
        profile={profile}
        studentProfile={studentProfile}
        professorProfile={professorProfile}
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}

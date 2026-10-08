import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { ProfessorDashboard } from '@/components/dashboard/professor-dashboard'

export default async function DashboardPage() {
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

  const isStudent = profile.role === 'student'

  if (isStudent) {
    // Fetch opportunities for students
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*, professor:profiles!professor_id(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch saved opportunities
    const { data: savedOpportunities } = await supabase
      .from('saved_opportunities')
      .select('opportunity_id')
      .eq('user_id', user.id)

    const savedIds = savedOpportunities?.map(s => s.opportunity_id) || []

    // Fetch applications
    const { data: applications } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return (
      <StudentDashboard 
        profile={profile}
        studentProfile={profile.student_profiles}
        opportunities={opportunities || []}
        savedIds={savedIds}
        applications={applications || []}
      />
    )
  } else {
    // Fetch professor's opportunities
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*')
      .eq('professor_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch applications to professor's opportunities
    const { data: applications } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(*), student:profiles!student_id(*)')
      .in('opportunity_id', opportunities?.map(o => o.id) || [])
      .order('created_at', { ascending: false })
      .limit(10)

    return (
      <ProfessorDashboard 
        profile={profile}
        professorProfile={profile.professor_profiles}
        opportunities={opportunities || []}
        applications={applications || []}
      />
    )
  }
}

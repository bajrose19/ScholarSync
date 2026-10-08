import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentApplications } from '@/components/dashboard/student-applications'
import { ProfessorApplications } from '@/components/dashboard/professor-applications'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/profile/setup')
  }

  const isStudent = profile.role === 'student'

  if (isStudent) {
    const { data: applications } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(*, professor:profiles!professor_id(*))')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    return <StudentApplications applications={applications || []} />
  } else {
    // Get professor's opportunities first
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('professor_id', user.id)

    const opportunityIds = opportunities?.map(o => o.id) || []

    const { data: applications } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(*), student:profiles!student_id(*, student_profiles(*))')
      .in('opportunity_id', opportunityIds)
      .order('created_at', { ascending: false })

    return <ProfessorApplications applications={applications || []} opportunities={opportunities || []} />
  }
}

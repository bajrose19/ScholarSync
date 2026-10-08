import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OpportunityDetail } from '@/components/opportunities/opportunity-detail'

interface OpportunityPageProps {
  params: Promise<{ id: string }>
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, student_profiles(*)')
    .eq('id', user.id)
    .single()

  // Fetch the opportunity with professor details
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*, professor:profiles!professor_id(*, professor_profiles(*))')
    .eq('id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  // Check if user has already applied (for students)
  let existingApplication = null
  let isSaved = false

  if (profile?.role === 'student') {
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('opportunity_id', id)
      .eq('student_id', user.id)
      .single()

    existingApplication = application

    const { data: saved } = await supabase
      .from('saved_opportunities')
      .select('id')
      .eq('opportunity_id', id)
      .eq('user_id', user.id)
      .single()

    isSaved = !!saved
  }

  // If professor, fetch applications for this opportunity
  let applications = []
  if (profile?.role === 'professor' && opportunity.professor_id === user.id) {
    const { data: apps } = await supabase
      .from('applications')
      .select('*, student:profiles!student_id(*, student_profiles(*))')
      .eq('opportunity_id', id)
      .order('created_at', { ascending: false })

    applications = apps || []
  }

  const isOwner = opportunity.professor_id === user.id

  return (
    <OpportunityDetail 
      opportunity={opportunity}
      profile={profile}
      studentProfile={profile?.student_profiles}
      existingApplication={existingApplication}
      isSaved={isSaved}
      isOwner={isOwner}
      applications={applications}
    />
  )
}

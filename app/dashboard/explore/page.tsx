import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExploreOpportunities } from '@/components/dashboard/explore-opportunities'

export default async function ExplorePage() {
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

  if (!profile || profile.role !== 'student') {
    redirect('/dashboard')
  }

  // Fetch all open opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*, professor:profiles!professor_id(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Fetch saved opportunities
  const { data: savedOpportunities } = await supabase
    .from('saved_opportunities')
    .select('opportunity_id')
    .eq('user_id', user.id)

  const savedIds = savedOpportunities?.map(s => s.opportunity_id) || []

  return (
    <ExploreOpportunities 
      opportunities={opportunities || []}
      savedIds={savedIds}
      studentProfile={profile.student_profiles}
    />
  )
}

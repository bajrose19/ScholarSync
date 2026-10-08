import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SavedOpportunities } from '@/components/dashboard/saved-opportunities'

export default async function SavedPage() {
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

  // Fetch saved opportunities with full details
  const { data: savedOpportunities } = await supabase
    .from('saved_opportunities')
    .select('*, opportunity:opportunities(*, professor:profiles!professor_id(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const opportunities = savedOpportunities?.map(s => ({
    ...s.opportunity,
    savedId: s.id
  })) || []

  return (
    <SavedOpportunities 
      opportunities={opportunities}
      studentProfile={profile.student_profiles}
    />
  )
}

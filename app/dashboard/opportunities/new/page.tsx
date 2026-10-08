import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewOpportunityForm } from '@/components/opportunities/new-opportunity-form'

export default async function NewOpportunityPage() {
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

  if (!profile || profile.role !== 'professor') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <NewOpportunityForm professorId={user.id} />
    </div>
  )
}

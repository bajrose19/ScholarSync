import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getViewer, listProfessorOpportunities } from '@/lib/data'
import { Plus } from 'lucide-react'

export default async function MyOpportunitiesPage() {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'professor') redirect('/dashboard')

  const opportunities = listProfessorOpportunities(profile.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Opportunities</h1>
          <p className="text-muted-foreground">Listings you have posted for students.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/opportunities/new">
            <Plus className="mr-2 h-4 w-4" />
            Post Opportunity
          </Link>
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You have not posted an opportunity yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opportunity) => (
            <Link key={opportunity.id} href={`/dashboard/opportunities/${opportunity.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                    <Badge variant={opportunity.status === 'open' ? 'default' : 'secondary'}>
                      {opportunity.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{opportunity.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OpportunityCard } from './opportunity-card'
import { Bookmark, Search, ArrowRight } from 'lucide-react'
import type { Opportunity, Profile, StudentProfile } from '@/lib/types'

interface SavedOpportunitiesProps {
  opportunities: (Opportunity & { professor?: Profile; savedId: string })[]
  studentProfile: StudentProfile | null
}

export function SavedOpportunities({ opportunities, studentProfile }: SavedOpportunitiesProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Saved Opportunities
        </h1>
        <p className="text-muted-foreground">
          Opportunities you have bookmarked for later
        </p>
      </div>

      {/* Opportunities Grid */}
      {opportunities.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={true}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bookmark className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No saved opportunities</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {"You haven't saved any opportunities yet. Explore opportunities and click the bookmark icon to save them here."}
            </p>
            <Button asChild>
              <Link href="/dashboard/explore">
                <Search className="mr-2 h-4 w-4" />
                Explore Opportunities
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

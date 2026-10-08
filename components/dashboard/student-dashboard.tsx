'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OpportunityCard } from './opportunity-card'
import { 
  Search, 
  Bookmark, 
  FileText, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import type { Profile, StudentProfile, Opportunity, Application } from '@/lib/types'
import { givenName } from '@/lib/utils'

interface StudentDashboardProps {
  profile: Profile
  studentProfile: StudentProfile | null
  opportunities: (Opportunity & { professor?: Profile })[]
  savedIds: string[]
  applications: (Application & { opportunity?: Opportunity })[]
}

export function StudentDashboard({ 
  profile, 
  studentProfile,
  opportunities, 
  savedIds,
  applications 
}: StudentDashboardProps) {
  const firstName = givenName(profile.full_name, 'there')
  
  // Simple matching: score based on skill/interest overlap
  const scoredOpportunities = opportunities.map(opp => {
    const studentSkills = studentProfile?.skills || []
    const studentInterests = studentProfile?.interests || []
    const oppSkills = opp.skills_needed || []
    const oppAreas = opp.research_areas || []

    const matchedSkills = studentSkills.filter(s => 
      oppSkills.some(os => os.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(os.toLowerCase()))
    )
    const matchedInterests = studentInterests.filter(i => 
      oppAreas.some(oa => oa.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(oa.toLowerCase()))
    )

    const skillScore = oppSkills.length > 0 ? matchedSkills.length / oppSkills.length : 0
    const interestScore = oppAreas.length > 0 ? matchedInterests.length / oppAreas.length : 0
    const score = (skillScore * 0.6) + (interestScore * 0.4)

    return { ...opp, matchScore: score, matchedSkills, matchedInterests }
  }).sort((a, b) => b.matchScore - a.matchScore)

  const topMatches = scoredOpportunities.slice(0, 6)
  const recentOpportunities = [...opportunities].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 4)

  const pendingApplications = applications.filter(a => a.status === 'pending').length
  const savedCount = savedIds.length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          {"Here's what's happening with your research journey"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topMatches.filter(o => o.matchScore > 0.3).length}</p>
                <p className="text-sm text-muted-foreground">Top Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-secondary">
                <Bookmark className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCount}</p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-accent/50">
                <FileText className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApplications}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{opportunities.length}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Matched Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommended for You
                </CardTitle>
                <CardDescription>
                  Based on your skills and interests
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/explore">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {topMatches.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {topMatches.slice(0, 4).map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      isSaved={savedIds.includes(opp.id)}
                      matchScore={opp.matchScore}
                      matchedSkills={opp.matchedSkills}
                      showMatchInfo={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No opportunities available yet.</p>
                  <p className="text-sm">Check back soon or explore all listings.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recently Posted</CardTitle>
                <CardDescription>
                  New opportunities from professors
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/explore">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {recentOpportunities.map((opp) => (
                    <Link 
                      key={opp.id} 
                      href={`/dashboard/opportunities/${opp.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{opp.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {opp.professor?.full_name} • {opp.professor?.university}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 ml-4">
                          {new Date(opp.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No recent opportunities
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Applications & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/explore">
                  <Search className="mr-2 h-4 w-4" />
                  Explore Opportunities
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/saved">
                  <Bookmark className="mr-2 h-4 w-4" />
                  View Saved ({savedCount})
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/profile">
                  Update Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Your Applications</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/applications">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-3 rounded-lg border border-border/50">
                      <p className="font-medium text-sm truncate">
                        {app.opportunity?.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant={
                            app.status === 'accepted' ? 'default' :
                            app.status === 'rejected' ? 'destructive' :
                            app.status === 'reviewed' ? 'secondary' :
                            'outline'
                          }
                        >
                          {app.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  {"You haven't applied to any opportunities yet"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Your Skills */}
          {studentProfile && studentProfile.skills && studentProfile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.skills.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {studentProfile.skills.length > 8 && (
                    <Badge variant="outline">
                      +{studentProfile.skills.length - 8} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

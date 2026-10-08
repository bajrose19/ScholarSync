'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  FileText, 
  Users,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { Profile, ProfessorProfile, Opportunity, Application } from '@/lib/types'
import { givenName } from '@/lib/utils'

interface ProfessorDashboardProps {
  profile: Profile
  professorProfile: ProfessorProfile | null
  opportunities: Opportunity[]
  applications: (Application & { opportunity?: Opportunity; student?: Profile })[]
}

export function ProfessorDashboard({ 
  profile, 
  professorProfile,
  opportunities, 
  applications 
}: ProfessorDashboardProps) {
  const firstName = givenName(profile.full_name, 'Professor')
  
  const openOpportunities = opportunities.filter(o => o.status === 'open')
  const pendingApplications = applications.filter(a => a.status === 'pending')
  const totalApplicants = applications.length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your research opportunities and review applications
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/opportunities/new">
            <Plus className="mr-2 h-4 w-4" />
            Post Opportunity
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openOpportunities.length}</p>
                <p className="text-sm text-muted-foreground">Open Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-accent/50">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApplications.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalApplicants}</p>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{opportunities.length}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Opportunities & Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Students who have applied to your opportunities
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/applications">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((app) => {
                    const studentInitials = app.student?.full_name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase() || 'S'

                    return (
                      <div 
                        key={app.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={app.student?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {studentInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{app.student?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied to: {app.opportunity?.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/applications/${app.id}`}>
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet.</p>
                  <p className="text-sm">Post opportunities to start receiving applications.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Opportunities</CardTitle>
                <CardDescription>
                  Research positions you have posted
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/opportunities">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {opportunities.length > 0 ? (
                <div className="space-y-3">
                  {opportunities.slice(0, 5).map((opp) => {
                    const appCount = applications.filter(a => a.opportunity_id === opp.id).length
                    return (
                      <Link 
                        key={opp.id} 
                        href={`/dashboard/opportunities/${opp.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{opp.title}</p>
                              <Badge 
                                variant={opp.status === 'open' ? 'default' : 'secondary'}
                                className="shrink-0"
                              >
                                {opp.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {appCount} application{appCount !== 1 ? 's' : ''} • {opp.positions_available} position{opp.positions_available !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No opportunities posted yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/opportunities/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Opportunity
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/dashboard/opportunities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Opportunity
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/applications">
                  <Users className="mr-2 h-4 w-4" />
                  Review Applications
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/profile">
                  Update Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Application Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-medium">
                    {applications.filter(a => a.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Reviewed</span>
                  </div>
                  <span className="font-medium">
                    {applications.filter(a => a.status === 'reviewed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Accepted</span>
                  </div>
                  <span className="font-medium">
                    {applications.filter(a => a.status === 'accepted').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-medium">
                    {applications.filter(a => a.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Areas */}
          {professorProfile && professorProfile.research_areas && professorProfile.research_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Research Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {professorProfile.research_areas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

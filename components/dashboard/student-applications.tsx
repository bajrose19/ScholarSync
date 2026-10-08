'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  ArrowRight,
  Building2
} from 'lucide-react'
import type { Application, Opportunity, Profile } from '@/lib/types'

interface StudentApplicationsProps {
  applications: (Application & { opportunity?: Opportunity & { professor?: Profile } })[]
}

export function StudentApplications({ applications }: StudentApplicationsProps) {
  const pendingCount = applications.filter(a => a.status === 'pending').length
  const reviewedCount = applications.filter(a => a.status === 'reviewed').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'reviewed':
        return <Eye className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'reviewed':
        return 'secondary'
      case 'accepted':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          My Applications
        </h1>
        <p className="text-muted-foreground">
          Track the status of your research opportunity applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Eye className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="text-2xl font-bold">{reviewedCount}</p>
                <p className="text-sm text-muted-foreground">Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => {
            const professorInitials = app.opportunity?.professor?.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || 'P'

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={app.opportunity?.professor?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {professorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link 
                          href={`/dashboard/opportunities/${app.opportunity_id}`}
                          className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1"
                        >
                          {app.opportunity?.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{app.opportunity?.professor?.full_name}</span>
                          {app.opportunity?.professor?.university && (
                            <>
                              <span className="text-border">•</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {app.opportunity.professor.university}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusColor(app.status) as "outline" | "secondary" | "default" | "destructive"}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1.5 capitalize">{app.status}</span>
                      </Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/opportunities/${app.opportunity_id}`}>
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {"You haven't applied to any research opportunities yet. Start exploring and apply to opportunities that interest you."}
            </p>
            <Button asChild>
              <Link href="/dashboard/explore">
                Explore Opportunities
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Building2,
  Mail,
  Loader2
} from 'lucide-react'
import type { Application, Opportunity, Profile, StudentProfile } from '@/lib/types'

interface ProfessorApplicationsProps {
  applications: (Application & { 
    opportunity?: Opportunity; 
    student?: Profile & { student_profiles?: StudentProfile } 
  })[]
  opportunities: { id: string; title: string }[]
}

export function ProfessorApplications({ applications, opportunities }: ProfessorApplicationsProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('all')
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<typeof applications[0] | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredApplications = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false
    if (opportunityFilter !== 'all' && app.opportunity_id !== opportunityFilter) return false
    return true
  })

  const updateStatus = async (applicationId: string, newStatus: string) => {
    setIsUpdating(true)
    const supabase = createClient()
    
    await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    router.refresh()
    setIsUpdating(false)
    setSelectedApplication(null)
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const reviewedCount = applications.filter(a => a.status === 'reviewed').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length
  const rejectedCount = applications.filter(a => a.status === 'rejected').length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Applications
        </h1>
        <p className="text-muted-foreground">
          Review and manage applications to your research opportunities
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by opportunity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Opportunities</SelectItem>
            {opportunities.map(opp => (
              <SelectItem key={opp.id} value={opp.id}>{opp.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const studentInitials = app.student?.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || 'S'

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={app.student?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {studentInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-lg">
                          {app.student?.full_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {app.student?.university && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {app.student.university}
                            </span>
                          )}
                          {app.student?.email && (
                            <>
                              <span className="text-border">•</span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {app.student.email}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Applied to: <Link href={`/dashboard/opportunities/${app.opportunity_id}`} className="text-primary hover:underline">{app.opportunity?.title}</Link>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={
                        app.status === 'accepted' ? 'default' :
                        app.status === 'rejected' ? 'destructive' :
                        app.status === 'reviewed' ? 'secondary' :
                        'outline'
                      }>
                        {app.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedApplication(app)}
                      >
                        Review
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
            <Users className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No applications found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {applications.length === 0 
                ? "You haven't received any applications yet. Post more opportunities to attract students."
                : "No applications match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Review Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Review Application</DialogTitle>
                <DialogDescription>
                  Application from {selectedApplication.student?.full_name} for {selectedApplication.opportunity?.title}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedApplication.student?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedApplication.student?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedApplication.student?.full_name}</h3>
                    <p className="text-muted-foreground">{selectedApplication.student?.email}</p>
                    {selectedApplication.student?.university && (
                      <p className="text-sm text-muted-foreground">{selectedApplication.student.university}</p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {selectedApplication.student?.student_profiles?.skills && selectedApplication.student.student_profiles.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.student.student_profiles.skills.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {selectedApplication.student?.student_profiles?.interests && selectedApplication.student.student_profiles.interests.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Research Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.student.student_profiles.interests.map(interest => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div>
                    <h4 className="font-medium mb-2">Cover Letter</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(selectedApplication.id, 'reviewed')}
                    disabled={isUpdating}
                  >
                    Mark as Reviewed
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus(selectedApplication.id, 'rejected')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    onClick={() => updateStatus(selectedApplication.id, 'accepted')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Accept
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

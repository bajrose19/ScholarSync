'use client'

import { useState } from 'react'
import Link from 'next/link'
import { applyToOpportunity, toggleSavedOpportunity } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Building2,
  Mail,
  Globe,
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react'
import type { Profile, StudentProfile, Opportunity, Application, ProfessorProfile } from '@/lib/types'

interface OpportunityDetailProps {
  opportunity: Opportunity & { 
    professor?: Profile & { professor_profiles?: ProfessorProfile | null } 
  }
  profile: Profile | null
  studentProfile: StudentProfile | null
  existingApplication: Application | null
  isSaved: boolean
  isOwner: boolean
  applications: (Application & { student?: Profile & { student_profiles?: StudentProfile } })[]
}

export function OpportunityDetail({ 
  opportunity, 
  profile,
  studentProfile,
  existingApplication, 
  isSaved: initialSaved,
  isOwner,
  applications
}: OpportunityDetailProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isToggling, setIsToggling] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applicationSubmitted, setApplicationSubmitted] = useState(!!existingApplication)

  const isStudent = profile?.role === 'student'
  const professor = opportunity.professor
  const professorInitials = professor?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'P'

  const deadline = opportunity.application_deadline
    ? new Date(opportunity.application_deadline)
    : null
  const isExpired = deadline && deadline < new Date()

  // Calculate match score
  const studentSkills = studentProfile?.skills || []
  const studentInterests = studentProfile?.interests || []
  const oppSkills = opportunity.skills_needed || []
  const oppAreas = opportunity.research_areas || []

  const matchedSkills = studentSkills.filter(s => 
    oppSkills.some(os => os.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(os.toLowerCase()))
  )
  const matchedInterests = studentInterests.filter(i => 
    oppAreas.some(oa => oa.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(oa.toLowerCase()))
  )
  const skillScore = oppSkills.length > 0 ? matchedSkills.length / oppSkills.length : 0
  const interestScore = oppAreas.length > 0 ? matchedInterests.length / oppAreas.length : 0
  const matchScore = (skillScore * 0.6) + (interestScore * 0.4)

  const toggleSave = async () => {
    if (isToggling) return
    setIsToggling(true)

    const result = await toggleSavedOpportunity(opportunity.id)
    if (!result.error && typeof result.saved === 'boolean') {
      setSaved(result.saved)
    }

    setIsToggling(false)
  }

  const handleApply = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await applyToOpportunity(opportunity.id, coverLetter)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    setApplicationSubmitted(true)
    setShowApplyDialog(false)
    setIsSubmitting(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge 
                  variant={opportunity.status === 'open' ? 'default' : 'secondary'}
                  className="mb-2"
                >
                  {opportunity.status}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground">
                  {opportunity.title}
                </h1>
              </div>
              {isStudent && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSave}
                  disabled={isToggling}
                >
                  {saved ? (
                    <BookmarkCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>

            {/* Match Score */}
            {isStudent && matchScore > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">
                    {Math.round(matchScore * 100)}% Match
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on {matchedSkills.length} matching skill{matchedSkills.length !== 1 ? 's' : ''} and {matchedInterests.length} research interest{matchedInterests.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {opportunity.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {opportunity.duration}
                </span>
              )}
              {opportunity.compensation && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  {opportunity.compensation}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {opportunity.positions_available} position{opportunity.positions_available !== 1 ? 's' : ''} available
              </span>
              {deadline && (
                <span className={`flex items-center gap-1.5 ${isExpired ? 'text-destructive' : ''}`}>
                  <Calendar className="h-4 w-4" />
                  {isExpired ? 'Deadline passed: ' : 'Apply by: '}
                  {deadline.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {opportunity.description}
              </p>
            </CardContent>
          </Card>

          {/* Requirements */}
          {opportunity.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {opportunity.requirements}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills Needed */}
          {oppSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {oppSkills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant={matchedSkills.includes(skill) ? 'default' : 'secondary'}
                    >
                      {matchedSkills.includes(skill) && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Research Areas */}
          {oppAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Research Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {oppAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications (for professors) */}
          {isOwner && applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applications ({applications.length})</CardTitle>
                <CardDescription>Review applications for this opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {applications.map((app) => {
                  const studentInitials = app.student?.full_name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase() || 'S'

                  return (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border">
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
                            {app.student?.university} • Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
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
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          {isStudent && (
            <Card>
              <CardContent className="pt-6">
                {applicationSubmitted || existingApplication ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Application Submitted</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your application is {existingApplication?.status || 'pending'}
                    </p>
                    <Badge variant={
                      existingApplication?.status === 'accepted' ? 'default' :
                      existingApplication?.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {existingApplication?.status || 'pending'}
                    </Badge>
                  </div>
                ) : isExpired ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                    <h3 className="font-semibold mb-2">Application Closed</h3>
                    <p className="text-sm text-muted-foreground">
                      The deadline for this opportunity has passed.
                    </p>
                  </div>
                ) : opportunity.status !== 'open' ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Position Filled</h3>
                    <p className="text-sm text-muted-foreground">
                      This opportunity is no longer accepting applications.
                    </p>
                  </div>
                ) : (
                  <>
                    <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          <Send className="mr-2 h-4 w-4" />
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply to {opportunity.title}</DialogTitle>
                          <DialogDescription>
                            Submit your application to this research opportunity
                          </DialogDescription>
                        </DialogHeader>

                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                            <Textarea
                              id="coverLetter"
                              placeholder="Tell the professor why you're interested in this opportunity and what makes you a good fit..."
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={6}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApply} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Your profile information will be shared with the professor
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/opportunities/${opportunity.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Opportunity
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Professor Info */}
          {professor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={professor.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {professorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{professor.full_name}</p>
                    {professor.professor_profiles?.title && (
                      <p className="text-sm text-muted-foreground">
                        {professor.professor_profiles.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {professor.university && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {professor.university}
                    </div>
                  )}
                  {professor.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {professor.department}
                    </div>
                  )}
                  {professor.professor_profiles?.lab_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {professor.professor_profiles.lab_name}
                    </div>
                  )}
                  {professor.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {professor.email}
                    </div>
                  )}
                  {professor.professor_profiles?.website_url && (
                    <a 
                      href={professor.professor_profiles.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Posted on {new Date(opportunity.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

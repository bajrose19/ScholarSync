'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GraduationCap, 
  Mail, 
  MapPin, 
  Building2, 
  Calendar, 
  Briefcase,
  Github,
  Linkedin,
  Globe,
  Edit,
  ArrowLeft
} from 'lucide-react'
import type { Profile, StudentProfile, ProfessorProfile } from '@/lib/types'

interface ProfileViewProps {
  profile: Profile
  studentProfile?: StudentProfile | null
  professorProfile?: ProfessorProfile | null
  isOwnProfile: boolean
}

export function ProfileView({ 
  profile, 
  studentProfile, 
  professorProfile, 
  isOwnProfile 
}: ProfileViewProps) {
  const isStudent = profile.role === 'student'
  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">ScholarSync</span>
            </Link>
          </div>
          {isOwnProfile && (
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile.full_name || 'Anonymous User'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isStudent ? 'default' : 'secondary'}>
                      {isStudent ? 'Student' : professorProfile?.title || 'Professor'}
                    </Badge>
                    {studentProfile?.major && (
                      <span className="text-muted-foreground text-sm">
                        {studentProfile.major}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                  )}
                  {profile.university && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {profile.university}
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {profile.department}
                    </div>
                  )}
                  {studentProfile?.graduation_year && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Class of {studentProfile.graduation_year}
                    </div>
                  )}
                  {professorProfile?.lab_name && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      {professorProfile.lab_name}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-2">
                  {studentProfile?.linkedin_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={studentProfile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {studentProfile?.github_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={studentProfile.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {professorProfile?.website_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={professorProfile.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {profile.bio && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Skills & Interests (Student) */}
        {isStudent && studentProfile && (
          <div className="grid md:grid-cols-2 gap-6">
            {studentProfile.skills && studentProfile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {studentProfile.interests && studentProfile.interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Research Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Research Areas (Professor) */}
        {!isStudent && professorProfile && professorProfile.research_areas && professorProfile.research_areas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Research Areas</CardTitle>
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
      </main>
    </div>
  )
}

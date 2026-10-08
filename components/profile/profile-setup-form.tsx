'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Loader2, AlertCircle, X, Plus, ArrowRight, ArrowLeft } from 'lucide-react'

interface ProfileSetupFormProps {
  userId: string
  email: string
  initialRole: 'student' | 'professor'
  initialFullName: string
  initialUniversity: string
}

const SUGGESTED_SKILLS = [
  'Python', 'R', 'Machine Learning', 'Data Analysis', 'JavaScript', 
  'Statistics', 'Lab Techniques', 'Scientific Writing', 'MATLAB', 'SQL'
]

const SUGGESTED_INTERESTS = [
  'Artificial Intelligence', 'Bioinformatics', 'Climate Science', 'Neuroscience',
  'Quantum Computing', 'Robotics', 'Genomics', 'Economics', 'Psychology', 'Physics'
]

const RESEARCH_AREAS = [
  'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
  'Engineering', 'Medicine', 'Psychology', 'Economics', 'Environmental Science'
]

export function ProfileSetupForm({ 
  userId, 
  email, 
  initialRole, 
  initialFullName, 
  initialUniversity 
}: ProfileSetupFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Basic info
  const [fullName, setFullName] = useState(initialFullName)
  const [university, setUniversity] = useState(initialUniversity)
  const [department, setDepartment] = useState('')
  const [bio, setBio] = useState('')

  // Student specific
  const [major, setMajor] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [gpa, setGpa] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  // Professor specific
  const [title, setTitle] = useState('')
  const [labName, setLabName] = useState('')
  const [researchAreas, setResearchAreas] = useState<string[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')

  const isStudent = initialRole === 'student'
  const totalSteps = isStudent ? 3 : 2

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
    }
    setNewSkill('')
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const addInterest = (interest: string) => {
    const trimmed = interest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed])
    }
    setNewInterest('')
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  const toggleResearchArea = (area: string) => {
    if (researchAreas.includes(area)) {
      setResearchAreas(researchAreas.filter(a => a !== area))
    } else {
      setResearchAreas([...researchAreas, area])
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          university,
          department,
          bio,
        })
        .eq('id', userId)

      if (profileError) throw profileError

      if (isStudent) {
        // Update student profile
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({
            major,
            graduation_year: graduationYear ? parseInt(graduationYear) : null,
            gpa: gpa ? parseFloat(gpa) : null,
            skills,
            interests,
            linkedin_url: linkedinUrl || null,
            github_url: githubUrl || null,
          })
          .eq('user_id', userId)

        if (studentError) throw studentError
      } else {
        // Update professor profile
        const { error: professorError } = await supabase
          .from('professor_profiles')
          .update({
            title,
            lab_name: labName || null,
            research_areas: researchAreas,
            website_url: websiteUrl || null,
          })
          .eq('user_id', userId)

        if (professorError) throw professorError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return fullName.trim().length > 0
    if (step === 2 && isStudent) return skills.length > 0 || interests.length > 0
    if (step === 2 && !isStudent) return researchAreas.length > 0
    if (step === 3 && isStudent) return true
    return true
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">ScholarSync</span>
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-16 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {step === 1 && 'Tell us about yourself'}
              {step === 2 && isStudent && 'Your skills & interests'}
              {step === 2 && !isStudent && 'Your research focus'}
              {step === 3 && 'Additional details'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'This helps us match you with the right opportunities'}
              {step === 2 && isStudent && 'Add your technical skills and research interests'}
              {step === 2 && !isStudent && 'Select your primary research areas'}
              {step === 3 && 'Optional: Add links to your profiles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Stanford University"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself and your research interests..."
                    rows={3}
                  />
                </div>

                {isStudent && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input
                          id="major"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Computer Science"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduationYear">Graduation Year</Label>
                        <Input
                          id="graduationYear"
                          type="number"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          placeholder="2025"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gpa">GPA (optional)</Label>
                      <Input
                        id="gpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="3.80"
                      />
                    </div>
                  </>
                )}

                {!isStudent && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Associate Professor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labName">Lab Name</Label>
                      <Input
                        id="labName"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="AI Research Lab"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Skills/Interests (Student) or Research Areas (Professor) */}
            {step === 2 && isStudent && (
              <div className="space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <Label>Skills *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill(newSkill)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => addSkill(newSkill)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <button onClick={() => removeSkill(skill)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Suggestions:</span>
                    {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 5).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => addSkill(skill)}
                      >
                        + {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-3">
                  <Label>Research Interests *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addInterest(newInterest)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => addInterest(newInterest)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="gap-1">
                          {interest}
                          <button onClick={() => removeInterest(interest)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Suggestions:</span>
                    {SUGGESTED_INTERESTS.filter(i => !interests.includes(i)).slice(0, 5).map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => addInterest(interest)}
                      >
                        + {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && !isStudent && (
              <div className="space-y-4">
                <Label>Research Areas *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RESEARCH_AREAS.map((area) => (
                    <div
                      key={area}
                      onClick={() => toggleResearchArea(area)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        researchAreas.includes(area)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <span className="text-sm font-medium">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Links (Student only) */}
            {step === 3 && isStudent && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub Profile</Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

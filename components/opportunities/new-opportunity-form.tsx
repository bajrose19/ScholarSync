'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createOpportunity } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, AlertCircle, X, Plus } from 'lucide-react'

interface NewOpportunityFormProps {
  professorId?: string
}

const RESEARCH_AREAS = [
  'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
  'Engineering', 'Medicine', 'Psychology', 'Economics', 'Environmental Science'
]

const SUGGESTED_SKILLS = [
  'Python', 'R', 'Machine Learning', 'Data Analysis', 'JavaScript', 
  'Statistics', 'Lab Techniques', 'Scientific Writing', 'MATLAB', 'SQL',
  'C++', 'Java', 'Research Methods', 'Literature Review'
]

export function NewOpportunityForm(_props: NewOpportunityFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [researchAreas, setResearchAreas] = useState<string[]>([])
  const [duration, setDuration] = useState('')
  const [compensation, setCompensation] = useState('')
  const [positions, setPositions] = useState('1')
  const [deadline, setDeadline] = useState('')

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

  const toggleResearchArea = (area: string) => {
    if (researchAreas.includes(area)) {
      setResearchAreas(researchAreas.filter(a => a !== area))
    } else {
      setResearchAreas([...researchAreas, area])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      setIsSubmitting(false)
      return
    }

    if (!description.trim()) {
      setError('Description is required')
      setIsSubmitting(false)
      return
    }

    const result = await createOpportunity({
      title,
      description,
      requirements,
      skills,
      researchAreas,
      duration,
      compensation,
      positions,
      deadline,
    })

    if (result.error || !result.id) {
      setError(result.error || 'Could not create opportunity')
      setIsSubmitting(false)
      return
    }

    router.push(`/dashboard/opportunities/${result.id}`)
    router.refresh()
  }

  return (
    <>
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Post New Opportunity</CardTitle>
          <CardDescription>
            Create a research opportunity listing to attract talented students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Research Assistant - Machine Learning Lab"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the research project, responsibilities, and what students will learn..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List any prerequisites, coursework, or experience required..."
                rows={3}
              />
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <Label>Skills Needed</Label>
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
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Suggestions:</span>
                {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 6).map((skill) => (
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

            {/* Research Areas */}
            <div className="space-y-3">
              <Label>Research Areas</Label>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={researchAreas.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleResearchArea(area)}
                  >
                    {researchAreas.includes(area) ? '✓ ' : ''}{area}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 semester">1 Semester</SelectItem>
                    <SelectItem value="2 semesters">2 Semesters</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="1 year">1 Year</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensation">Compensation</Label>
                <Select value={compensation} onValueChange={setCompensation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compensation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Stipend">Stipend</SelectItem>
                    <SelectItem value="Course Credit">Course Credit</SelectItem>
                    <SelectItem value="Negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positions">Positions Available</Label>
                <Input
                  id="positions"
                  type="number"
                  min="1"
                  value={positions}
                  onChange={(e) => setPositions(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Opportunity'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

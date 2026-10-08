'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OpportunityCard } from './opportunity-card'
import { Search, Filter, X, Sparkles, Clock, Building2 } from 'lucide-react'
import type { Opportunity, Profile, StudentProfile } from '@/lib/types'

interface ExploreOpportunitiesProps {
  opportunities: (Opportunity & { professor?: Profile })[]
  savedIds: string[]
  studentProfile: StudentProfile | null
}

const RESEARCH_AREAS = [
  'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
  'Engineering', 'Medicine', 'Psychology', 'Economics', 'Environmental Science'
]

export function ExploreOpportunities({ 
  opportunities, 
  savedIds, 
  studentProfile 
}: ExploreOpportunitiesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'deadline'>('match')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Get all unique skills from opportunities
  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    opportunities.forEach(opp => {
      opp.skills_needed?.forEach(skill => skills.add(skill))
    })
    return Array.from(skills).sort()
  }, [opportunities])

  // Score and filter opportunities
  const processedOpportunities = useMemo(() => {
    const studentSkills = studentProfile?.skills || []
    const studentInterests = studentProfile?.interests || []

    return opportunities
      .map(opp => {
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
        const matchScore = (skillScore * 0.6) + (interestScore * 0.4)

        return { ...opp, matchScore, matchedSkills, matchedInterests }
      })
      .filter(opp => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesSearch = 
            opp.title.toLowerCase().includes(query) ||
            opp.description.toLowerCase().includes(query) ||
            opp.professor?.full_name?.toLowerCase().includes(query) ||
            opp.professor?.university?.toLowerCase().includes(query) ||
            opp.skills_needed?.some(s => s.toLowerCase().includes(query)) ||
            opp.research_areas?.some(a => a.toLowerCase().includes(query))
          if (!matchesSearch) return false
        }

        // Area filter
        if (selectedArea && selectedArea !== 'all') {
          if (!opp.research_areas?.includes(selectedArea)) return false
        }

        // Skills filter
        if (selectedSkills.length > 0) {
          const hasSelectedSkill = selectedSkills.some(skill =>
            opp.skills_needed?.includes(skill)
          )
          if (!hasSelectedSkill) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore
        if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'deadline') {
          const aDeadline = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity
          const bDeadline = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity
          return aDeadline - bDeadline
        }
        return 0
      })
  }, [opportunities, searchQuery, selectedArea, selectedSkills, sortBy, studentProfile])

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedArea('all')
    setSelectedSkills([])
    setSortBy('match')
  }

  const hasActiveFilters = searchQuery || selectedArea !== 'all' || selectedSkills.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Explore Opportunities
        </h1>
        <p className="text-muted-foreground">
          Discover research positions that match your skills and interests
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, skills, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Best Match
                  </span>
                </SelectItem>
                <SelectItem value="recent">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Most Recent
                  </span>
                </SelectItem>
                <SelectItem value="deadline">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Deadline
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {(selectedArea !== 'all' ? 1 : 0) + selectedSkills.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Research Area</label>
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger>
                      <SelectValue placeholder="All areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {RESEARCH_AREAS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Required Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.slice(0, 15).map(skill => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {processedOpportunities.length} of {opportunities.length} opportunities
      </p>

      {/* Opportunities Grid */}
      {processedOpportunities.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={savedIds.includes(opp.id)}
              matchScore={opp.matchScore}
              matchedSkills={opp.matchedSkills}
              showMatchInfo={sortBy === 'match'}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bookmark, 
  BookmarkCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users,
  Building2,
  Sparkles
} from 'lucide-react'
import { toggleSavedOpportunity } from '@/lib/actions'
import { useState } from 'react'
import type { Opportunity, Profile } from '@/lib/types'

interface OpportunityCardProps {
  opportunity: Opportunity & { professor?: Profile }
  isSaved?: boolean
  matchScore?: number
  matchedSkills?: string[]
  showMatchInfo?: boolean
}

export function OpportunityCard({ 
  opportunity, 
  isSaved = false, 
  matchScore,
  matchedSkills = [],
  showMatchInfo = false 
}: OpportunityCardProps) {
  const [saved, setSaved] = useState(isSaved)
  const [isToggling, setIsToggling] = useState(false)

  const professorInitials = opportunity.professor?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'P'

  const deadline = opportunity.application_deadline
    ? new Date(opportunity.application_deadline)
    : null
  const isUrgent = deadline && (deadline.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isToggling) return
    setIsToggling(true)

    const result = await toggleSavedOpportunity(opportunity.id)
    if (!result.error && typeof result.saved === 'boolean') {
      setSaved(result.saved)
    }

    setIsToggling(false)
  }

  return (
    <Link href={`/dashboard/opportunities/${opportunity.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow border-border/50 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {opportunity.title}
              </h3>
              {opportunity.professor && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={opportunity.professor.avatar_url || ''} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {professorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">
                    {opportunity.professor.full_name}
                  </span>
                  {opportunity.professor.university && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {opportunity.professor.university}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={toggleSave}
              disabled={isToggling}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Match Score */}
          {showMatchInfo && matchScore !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
                {Math.round(matchScore * 100)}% Match
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {opportunity.description}
          </p>

          {/* Skills */}
          {opportunity.skills_needed && opportunity.skills_needed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {opportunity.skills_needed.slice(0, 4).map((skill) => (
                <Badge 
                  key={skill} 
                  variant={matchedSkills.includes(skill) ? 'default' : 'outline'} 
                  className="text-xs"
                >
                  {skill}
                </Badge>
              ))}
              {opportunity.skills_needed.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{opportunity.skills_needed.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Research Areas */}
          {opportunity.research_areas && opportunity.research_areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.research_areas.slice(0, 2).map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground w-full">
            {opportunity.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {opportunity.duration}
              </span>
            )}
            {opportunity.compensation && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {opportunity.compensation}
              </span>
            )}
            {opportunity.positions_available > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {opportunity.positions_available} position{opportunity.positions_available > 1 ? 's' : ''}
              </span>
            )}
            {deadline && (
              <span className={`flex items-center gap-1 ml-auto ${isUrgent ? 'text-destructive' : ''}`}>
                <Calendar className="h-3 w-3" />
                {isUrgent ? 'Ending soon: ' : ''}
                {deadline.toLocaleDateString()}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

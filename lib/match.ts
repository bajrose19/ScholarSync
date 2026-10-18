import {
  FIELD_TRACK_LABELS,
  isFieldTrack,
  type FieldTrack,
  type WorkMode,
} from '@/lib/catalog'

export interface MatchStudent {
  skills?: string[] | null
  interests?: string[] | null
  field_track?: string | null
  open_to_remote?: boolean | null
  willing_to_relocate?: boolean | null
}

export interface MatchOpportunity {
  skills_needed?: string[] | null
  research_areas?: string[] | null
  field_track?: string | null
  country?: string | null
  work_mode?: string | null
  open_to_international?: boolean | null
}

export interface MatchResult {
  score: number
  matchedSkills: string[]
  matchedInterests: string[]
  reasoning: string
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

function overlaps(left: string[] | null | undefined, right: string[] | null | undefined): string[] {
  const haystack = right || []
  return (left || []).filter((item) => {
    const a = normalize(item)
    if (!a) return false
    return haystack.some((other) => {
      const b = normalize(other)
      if (!b) return false
      if (a === b) return true
      if (a.length < 3 || b.length < 3) return false
      return a.includes(b) || b.includes(a)
    })
  })
}

function coverage(matched: string[], total: string[] | null | undefined): number {
  const size = total?.length || 0
  if (size === 0) return 0.5
  return matched.length / size
}

function fieldScore(studentTrack: string | null | undefined, opportunityTrack: string | null | undefined): number {
  if (!isFieldTrack(studentTrack) || !isFieldTrack(opportunityTrack)) return 0.6
  if (studentTrack === 'both' || opportunityTrack === 'both' || studentTrack === opportunityTrack) return 1
  return 0.15
}

function fieldNote(studentTrack: string | null | undefined, opportunityTrack: string | null | undefined): string {
  if (!isFieldTrack(opportunityTrack)) return 'The lab has not chosen a medical or technology track.'
  if (!isFieldTrack(studentTrack)) return `This is a ${FIELD_TRACK_LABELS[opportunityTrack].toLowerCase()} role.`
  if (studentTrack === opportunityTrack) {
    return `Your ${FIELD_TRACK_LABELS[studentTrack].toLowerCase()} track matches this role.`
  }
  if (studentTrack === 'both' || opportunityTrack === 'both') {
    return 'This role sits across medicine and technology, which fits a cross-disciplinary profile.'
  }
  return `Your profile is ${FIELD_TRACK_LABELS[studentTrack as FieldTrack].toLowerCase()}, and this role is ${FIELD_TRACK_LABELS[opportunityTrack].toLowerCase()}.`
}

function locationFit(
  student: MatchStudent | null | undefined,
  studentCountry: string | null | undefined,
  opportunity: MatchOpportunity,
): { score: number; note: string } {
  const mode = opportunity.work_mode as WorkMode | null | undefined
  const labCountry = opportunity.country?.trim()
  const sameCountry = Boolean(
    labCountry && studentCountry && normalize(labCountry) === normalize(studentCountry),
  )

  if (mode === 'remote') {
    if (student?.open_to_remote === false) {
      return {
        score: 0.35,
        note: 'This role is remote, and your profile prefers in-person work.',
      }
    }
    return {
      score: 1,
      note: 'This role is remote, so you can join from your current country.',
    }
  }

  if (!labCountry) {
    return { score: 0.6, note: 'The lab has not listed a country yet.' }
  }

  const placeLabel = mode === 'hybrid' ? 'hybrid' : 'on-site'
  if (sameCountry) {
    return { score: 1, note: `This ${placeLabel} lab is in ${labCountry}, the same country as you.` }
  }

  if (opportunity.open_to_international === false) {
    return {
      score: 0.05,
      note: `This ${placeLabel} role in ${labCountry} is limited to local students.`,
    }
  }

  if (student?.willing_to_relocate) {
    return {
      score: 0.9,
      note: `You are open to relocating, and this lab in ${labCountry} accepts international students.`,
    }
  }

  return {
    score: 0.25,
    note: `This role is ${placeLabel} in ${labCountry}. Mark that you can relocate if you are able to be there in person.`,
  }
}

export function scoreMatch(
  student: MatchStudent | null | undefined,
  opportunity: MatchOpportunity,
  studentCountry?: string | null,
): MatchResult {
  const matchedSkills = overlaps(student?.skills, opportunity.skills_needed)
  const matchedInterests = overlaps(student?.interests, opportunity.research_areas)
  const skills = coverage(matchedSkills, opportunity.skills_needed)
  const interests = coverage(matchedInterests, opportunity.research_areas)
  const field = fieldScore(student?.field_track, opportunity.field_track)
  const location = locationFit(student, studentCountry, opportunity)

  let score = skills * 0.45 + interests * 0.25 + field * 0.15 + location.score * 0.15
  // A role the student cannot join should not outrank one they can.
  if (location.score <= 0.05) score = Math.min(score, 0.2)
  const parts = [
    matchedSkills.length > 0 ? `Shared skills: ${matchedSkills.slice(0, 3).join(', ')}.` : '',
    matchedInterests.length > 0 ? `Shared interests: ${matchedInterests.slice(0, 3).join(', ')}.` : '',
    fieldNote(student?.field_track, opportunity.field_track),
    location.note,
  ].filter(Boolean)

  return {
    score: Math.max(0, Math.min(1, score)),
    matchedSkills,
    matchedInterests,
    reasoning: parts.join(' '),
  }
}

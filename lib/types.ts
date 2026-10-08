export type UserRole = 'student' | 'professor'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  university: string | null
  department: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  major: string | null
  graduation_year: number | null
  gpa: number | null
  skills: string[]
  interests: string[]
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfessorProfile {
  id: string
  user_id: string
  title: string | null
  research_areas: string[]
  lab_name: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  professor_id: string
  title: string
  description: string
  requirements: string | null
  skills_needed: string[]
  research_areas: string[]
  duration: string | null
  compensation: string | null
  positions_available: number
  application_deadline: string | null
  status: 'open' | 'closed' | 'filled'
  created_at: string
  updated_at: string
  // Joined fields
  professor?: Profile
}

export interface Application {
  id: string
  opportunity_id: string
  student_id: string
  cover_letter: string | null
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Joined fields
  opportunity?: Opportunity
  student?: Profile
}

export interface SavedOpportunity {
  id: string
  user_id: string
  opportunity_id: string
  created_at: string
  // Joined fields
  opportunity?: Opportunity
}

// Form types
export interface SignUpFormData {
  email: string
  password: string
  fullName: string
  role: UserRole
  university?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface StudentProfileFormData {
  major: string
  graduation_year: number | null
  gpa: number | null
  skills: string[]
  interests: string[]
  linkedin_url: string
  github_url: string
}

export interface ProfessorProfileFormData {
  title: string
  research_areas: string[]
  lab_name: string
  website_url: string
}

// Match score for AI matching
export interface MatchScore {
  opportunity: Opportunity
  score: number
  matchedSkills: string[]
  matchedInterests: string[]
  reasoning: string
}

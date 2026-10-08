import { cookies } from 'next/headers'
import { getDb, mapApplication, mapOpportunity, mapProfessor, mapProfile, mapStudent } from '@/lib/db'
import { readSessionToken, SESSION_COOKIE } from '@/lib/session'
import type { Application, Opportunity, Profile, ProfessorProfile, StudentProfile } from '@/lib/types'

type Row = Record<string, unknown>

export type FullProfile = Profile & {
  student_profiles: StudentProfile | null
  professor_profiles: ProfessorProfile | null
}

export type OpportunityWithProfessor = Opportunity & {
  professor?: Profile & { professor_profiles?: ProfessorProfile }
}

export type ApplicationWithOpportunity = Application & {
  opportunity?: OpportunityWithProfessor
}

export type ApplicationWithStudent = Application & {
  opportunity?: Opportunity
  student?: Profile & { student_profiles?: StudentProfile }
}

function row(value: unknown) {
  return (value ?? undefined) as Row | undefined
}

export async function getCurrentUserId() {
  const jar = await cookies()
  return readSessionToken(jar.get(SESSION_COOKIE)?.value)
}

export function getFullProfile(userId: string): FullProfile | null {
  const db = getDb()
  const user = row(db.prepare('SELECT * FROM users WHERE id = ?').get(userId))
  if (!user) return null
  const student = row(db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId))
  const professor = row(db.prepare('SELECT * FROM professor_profiles WHERE user_id = ?').get(userId))
  return {
    ...mapProfile(user),
    student_profiles: mapStudent(student),
    professor_profiles: mapProfessor(professor),
  }
}

export async function getViewer() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  return getFullProfile(userId)
}

function withProfessor(opportunity: Opportunity): OpportunityWithProfessor {
  const db = getDb()
  const professorRow = row(db.prepare('SELECT * FROM users WHERE id = ?').get(opportunity.professor_id))
  if (!professorRow) return opportunity
  const professorProfile = mapProfessor(
    row(db.prepare('SELECT * FROM professor_profiles WHERE user_id = ?').get(opportunity.professor_id)),
  )
  return {
    ...opportunity,
    professor: {
      ...mapProfile(professorRow),
      professor_profiles: professorProfile ?? undefined,
    },
  }
}

export function listOpenOpportunities() {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM opportunities WHERE status = 'open' ORDER BY created_at DESC`,
  ).all() as Row[]
  return rows.map((item) => withProfessor(mapOpportunity(item)))
}

export function listProfessorOpportunities(professorId: string) {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM opportunities WHERE professor_id = ? ORDER BY created_at DESC`,
  ).all(professorId) as Row[]
  return rows.map((item) => mapOpportunity(item))
}

export function getOpportunity(id: string) {
  const db = getDb()
  const item = row(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id))
  if (!item) return null
  return withProfessor(mapOpportunity(item))
}

export function listSavedIds(userId: string) {
  const db = getDb()
  const rows = db.prepare(
    'SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?',
  ).all(userId) as Row[]
  return rows.map((item) => String(item.opportunity_id))
}

export function isOpportunitySaved(userId: string, opportunityId: string) {
  const db = getDb()
  const item = db.prepare(
    'SELECT id FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
  ).get(userId, opportunityId)
  return Boolean(item)
}

export function listSavedOpportunities(userId: string) {
  const db = getDb()
  const rows = db.prepare(
    `SELECT s.id AS saved_id, o.*
     FROM saved_opportunities s
     JOIN opportunities o ON o.id = s.opportunity_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
  ).all(userId) as Row[]
  return rows.map((item) => ({
    ...withProfessor(mapOpportunity(item)),
    savedId: String(item.saved_id),
  }))
}

function studentFor(userId: string) {
  const db = getDb()
  const user = row(db.prepare('SELECT * FROM users WHERE id = ?').get(userId))
  if (!user) return undefined
  return {
    ...mapProfile(user),
    student_profiles: mapStudent(
      row(db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId)),
    ) ?? undefined,
  }
}

export function listStudentApplications(studentId: string): ApplicationWithOpportunity[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM applications WHERE student_id = ? ORDER BY created_at DESC`,
  ).all(studentId) as Row[]
  return rows.map((item) => {
    const application = mapApplication(item)
    const opportunity = getOpportunity(application.opportunity_id)
    return { ...application, opportunity: opportunity ?? undefined }
  })
}

export function getStudentApplication(opportunityId: string, studentId: string) {
  const db = getDb()
  const item = row(
    db.prepare(
      'SELECT * FROM applications WHERE opportunity_id = ? AND student_id = ?',
    ).get(opportunityId, studentId),
  )
  return item ? mapApplication(item) : null
}

export function listApplicationsForProfessor(professorId: string): ApplicationWithStudent[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT a.*
     FROM applications a
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE o.professor_id = ?
     ORDER BY a.created_at DESC`,
  ).all(professorId) as Row[]
  return rows.map((item) => {
    const application = mapApplication(item)
    const opportunityRow = row(
      db.prepare('SELECT * FROM opportunities WHERE id = ?').get(application.opportunity_id),
    )
    return {
      ...application,
      opportunity: opportunityRow ? mapOpportunity(opportunityRow) : undefined,
      student: studentFor(application.student_id),
    }
  })
}

export function listApplicationsForOpportunity(opportunityId: string): ApplicationWithStudent[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM applications WHERE opportunity_id = ? ORDER BY created_at DESC`,
  ).all(opportunityId) as Row[]
  return rows.map((item) => {
    const application = mapApplication(item)
    return {
      ...application,
      student: studentFor(application.student_id),
    }
  })
}

export function listProfessorOpportunitySummaries(professorId: string) {
  const db = getDb()
  const rows = db.prepare(
    'SELECT id, title FROM opportunities WHERE professor_id = ? ORDER BY created_at DESC',
  ).all(professorId) as Row[]
  return rows.map((item) => ({ id: String(item.id), title: String(item.title) }))
}

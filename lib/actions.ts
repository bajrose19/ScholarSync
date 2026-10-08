'use server'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getDb, hashPassword, verifyPassword } from '@/lib/db'
import { getCurrentUserId, getFullProfile } from '@/lib/data'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import type { Application, UserRole } from '@/lib/types'

async function setSession(userId: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, createSessionToken(userId), sessionCookieOptions)
}

export async function signUp(input: {
  email: string
  password: string
  fullName: string
  role: UserRole
  university?: string
}) {
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()
  const role = input.role === 'professor' ? 'professor' : 'student'
  if (!email || !fullName) return { error: 'Name and email are required' }
  if (input.password.length < 6) return { error: 'Password must be at least 6 characters' }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return { error: 'An account with this email already exists' }

  const now = new Date().toISOString()
  const userId = crypto.randomUUID()
  const university = input.university?.trim() || null

  db.exec('BEGIN')
  try {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, role, university, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(userId, email, hashPassword(input.password), fullName, role, university, now, now)

    if (role === 'student') {
      db.prepare(
        `INSERT INTO student_profiles (id, user_id, skills, interests, created_at, updated_at)
         VALUES (?, ?, '[]', '[]', ?, ?)`,
      ).run(crypto.randomUUID(), userId, now, now)
    } else {
      db.prepare(
        `INSERT INTO professor_profiles (id, user_id, research_areas, created_at, updated_at)
         VALUES (?, ?, '[]', ?, ?)`,
      ).run(crypto.randomUUID(), userId, now, now)
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    return { error: error instanceof Error ? error.message : 'Could not create account' }
  }

  await setSession(userId)
  return { success: true }
}

export async function signIn(email: string, password: string) {
  const db = getDb()
  const user = db.prepare(
    'SELECT id, password_hash FROM users WHERE email = ?',
  ).get(email.trim().toLowerCase()) as { id: string; password_hash: string } | undefined
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: 'Invalid email or password' }
  }
  await setSession(user.id)
  return { success: true }
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  revalidatePath('/', 'layout')
}

export async function resetPassword(email: string, password: string) {
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as
    | { id: string }
    | undefined
  if (!user) return { error: 'No account uses that email' }
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    hashPassword(password),
    new Date().toISOString(),
    user.id,
  )
  return { success: true }
}

export async function saveProfile(input: {
  fullName: string
  university: string
  department: string
  bio: string
  major?: string
  graduationYear?: string
  gpa?: string
  skills?: string[]
  interests?: string[]
  linkedinUrl?: string
  githubUrl?: string
  title?: string
  labName?: string
  researchAreas?: string[]
  websiteUrl?: string
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be logged in' }
  const profile = getFullProfile(userId)
  if (!profile) return { error: 'Profile not found' }

  const now = new Date().toISOString()
  const db = getDb()
  db.prepare(
    `UPDATE users
     SET full_name = ?, university = ?, department = ?, bio = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.fullName.trim(),
    input.university.trim() || null,
    input.department.trim() || null,
    input.bio.trim() || null,
    now,
    userId,
  )

  if (profile.role === 'student') {
    db.prepare(
      `UPDATE student_profiles
       SET major = ?, graduation_year = ?, gpa = ?, skills = ?, interests = ?,
           linkedin_url = ?, github_url = ?, updated_at = ?
       WHERE user_id = ?`,
    ).run(
      input.major?.trim() || null,
      input.graduationYear ? Number(input.graduationYear) : null,
      input.gpa ? Number(input.gpa) : null,
      JSON.stringify(input.skills ?? []),
      JSON.stringify(input.interests ?? []),
      input.linkedinUrl?.trim() || null,
      input.githubUrl?.trim() || null,
      now,
      userId,
    )
  } else {
    db.prepare(
      `UPDATE professor_profiles
       SET title = ?, lab_name = ?, research_areas = ?, website_url = ?, updated_at = ?
       WHERE user_id = ?`,
    ).run(
      input.title?.trim() || null,
      input.labName?.trim() || null,
      JSON.stringify(input.researchAreas ?? []),
      input.websiteUrl?.trim() || null,
      now,
      userId,
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}

export async function toggleSavedOpportunity(opportunityId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be logged in' }
  const profile = getFullProfile(userId)
  if (!profile || profile.role !== 'student') return { error: 'Only students can save opportunities' }

  const db = getDb()
  const existing = db.prepare(
    'SELECT id FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
  ).get(userId, opportunityId) as { id: string } | undefined

  if (existing) {
    db.prepare('DELETE FROM saved_opportunities WHERE id = ?').run(existing.id)
    revalidatePath('/dashboard')
    return { saved: false }
  }

  const opportunity = db.prepare('SELECT id FROM opportunities WHERE id = ?').get(opportunityId)
  if (!opportunity) return { error: 'Opportunity not found' }

  db.prepare(
    'INSERT INTO saved_opportunities (id, user_id, opportunity_id, created_at) VALUES (?, ?, ?, ?)',
  ).run(crypto.randomUUID(), userId, opportunityId, new Date().toISOString())
  revalidatePath('/dashboard')
  return { saved: true }
}

export async function applyToOpportunity(opportunityId: string, coverLetter: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be logged in to apply' }
  const profile = getFullProfile(userId)
  if (!profile || profile.role !== 'student') return { error: 'Only students can apply' }

  const db = getDb()
  const opportunity = db.prepare(
    `SELECT id, professor_id, status FROM opportunities WHERE id = ?`,
  ).get(opportunityId) as { id: string; professor_id: string; status: string } | undefined
  if (!opportunity || opportunity.status !== 'open') return { error: 'This opportunity is not open' }
  if (opportunity.professor_id === userId) return { error: 'You cannot apply to your own opportunity' }

  const now = new Date().toISOString()
  try {
    db.prepare(
      `INSERT INTO applications (id, opportunity_id, student_id, cover_letter, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(crypto.randomUUID(), opportunityId, userId, coverLetter.trim() || null, now, now)
  } catch {
    return { error: 'You have already applied to this opportunity' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createOpportunity(input: {
  title: string
  description: string
  requirements: string
  skills: string[]
  researchAreas: string[]
  duration: string
  compensation: string
  positions: string
  deadline: string
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be logged in' }
  const profile = getFullProfile(userId)
  if (!profile || profile.role !== 'professor') return { error: 'Only professors can post opportunities' }

  const title = input.title.trim()
  const description = input.description.trim()
  if (!title) return { error: 'Title is required' }
  if (!description) return { error: 'Description is required' }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  getDb().prepare(
    `INSERT INTO opportunities (
      id, professor_id, title, description, requirements, skills_needed, research_areas,
      duration, compensation, positions_available, application_deadline, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
  ).run(
    id,
    userId,
    title,
    description,
    input.requirements.trim() || null,
    JSON.stringify(input.skills),
    JSON.stringify(input.researchAreas),
    input.duration || null,
    input.compensation || null,
    Number.parseInt(input.positions, 10) || 1,
    input.deadline || null,
    now,
    now,
  )

  revalidatePath('/dashboard')
  return { id }
}

export async function updateApplicationStatus(applicationId: string, status: Application['status']) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be logged in' }
  const allowed = ['pending', 'reviewed', 'accepted', 'rejected']
  if (!allowed.includes(status)) return { error: 'Invalid status' }

  const db = getDb()
  const application = db.prepare(
    `SELECT a.id
     FROM applications a
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.id = ? AND o.professor_id = ?`,
  ).get(applicationId, userId)
  if (!application) return { error: 'Application not found' }

  db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?').run(
    status,
    new Date().toISOString(),
    applicationId,
  )
  revalidatePath('/dashboard')
  return { success: true }
}

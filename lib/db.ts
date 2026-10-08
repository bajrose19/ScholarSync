import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { DatabaseSync } from 'node:sqlite'
import type {
  Application,
  Opportunity,
  ProfessorProfile,
  Profile,
  StudentProfile,
  UserRole,
} from '@/lib/types'

type Row = Record<string, unknown>

const globalForDb = globalThis as unknown as { __scholarsyncDb?: DatabaseSync }

function str(row: Row, key: string) {
  const value = row[key]
  return value == null ? '' : String(value)
}

function strOrNull(row: Row, key: string) {
  const value = row[key]
  if (value == null || value === '') return null
  return String(value)
}

function num(row: Row, key: string, fallback = 0) {
  const value = Number(row[key])
  return Number.isFinite(value) ? value : fallback
}

function numOrNull(row: Row, key: string) {
  if (row[key] == null || row[key] === '') return null
  const value = Number(row[key])
  return Number.isFinite(value) ? value : null
}

function jsonArray(row: Row, key: string) {
  const value = row[key]
  if (Array.isArray(value)) return value.map(String)
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function mapProfile(row: Row): Profile {
  return {
    id: str(row, 'id'),
    email: str(row, 'email'),
    full_name: strOrNull(row, 'full_name'),
    role: str(row, 'role') as UserRole,
    university: strOrNull(row, 'university'),
    department: strOrNull(row, 'department'),
    bio: strOrNull(row, 'bio'),
    avatar_url: strOrNull(row, 'avatar_url'),
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
  }
}

export function mapStudent(row: Row | undefined): StudentProfile | null {
  if (!row) return null
  return {
    id: str(row, 'id'),
    user_id: str(row, 'user_id'),
    major: strOrNull(row, 'major'),
    graduation_year: numOrNull(row, 'graduation_year'),
    gpa: numOrNull(row, 'gpa'),
    skills: jsonArray(row, 'skills'),
    interests: jsonArray(row, 'interests'),
    resume_url: strOrNull(row, 'resume_url'),
    linkedin_url: strOrNull(row, 'linkedin_url'),
    github_url: strOrNull(row, 'github_url'),
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
  }
}

export function mapProfessor(row: Row | undefined): ProfessorProfile | null {
  if (!row) return null
  return {
    id: str(row, 'id'),
    user_id: str(row, 'user_id'),
    title: strOrNull(row, 'title'),
    research_areas: jsonArray(row, 'research_areas'),
    lab_name: strOrNull(row, 'lab_name'),
    website_url: strOrNull(row, 'website_url'),
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
  }
}

export function mapOpportunity(row: Row, professor?: Profile): Opportunity {
  return {
    id: str(row, 'id'),
    professor_id: str(row, 'professor_id'),
    title: str(row, 'title'),
    description: str(row, 'description'),
    requirements: strOrNull(row, 'requirements'),
    skills_needed: jsonArray(row, 'skills_needed'),
    research_areas: jsonArray(row, 'research_areas'),
    duration: strOrNull(row, 'duration'),
    compensation: strOrNull(row, 'compensation'),
    positions_available: num(row, 'positions_available', 1),
    application_deadline: strOrNull(row, 'application_deadline'),
    status: str(row, 'status') as Opportunity['status'],
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
    professor,
  }
}

export function mapApplication(row: Row): Application {
  return {
    id: str(row, 'id'),
    opportunity_id: str(row, 'opportunity_id'),
    student_id: str(row, 'student_id'),
    cover_letter: strOrNull(row, 'cover_letter'),
    status: str(row, 'status') as Application['status'],
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const actual = crypto.scryptSync(password, salt, 32)
  const expected = Buffer.from(hash, 'hex')
  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}

function seed(db: DatabaseSync) {
  const now = new Date().toISOString()
  const professorId = crypto.randomUUID()
  const professorProfileId = crypto.randomUUID()
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, university, department, bio, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'professor', ?, ?, ?, ?, ?)`,
  ).run(
    professorId,
    'maya.chen@university.edu',
    hashPassword('demo1234'),
    'Dr. Maya Chen',
    'State University',
    'Computer Science',
    'I lead the Adaptive Systems Lab and look for students who enjoy applied machine learning.',
    now,
    now,
  )
  db.prepare(
    `INSERT INTO professor_profiles (id, user_id, title, research_areas, lab_name, website_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    professorProfileId,
    professorId,
    'Associate Professor',
    JSON.stringify(['Computer Science', 'Artificial Intelligence']),
    'Adaptive Systems Lab',
    'https://example.edu/labs/adaptive-systems',
    now,
    now,
  )

  const insertOpportunity = db.prepare(
    `INSERT INTO opportunities (
      id, professor_id, title, description, requirements, skills_needed, research_areas,
      duration, compensation, positions_available, application_deadline, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
  )
  insertOpportunity.run(
    crypto.randomUUID(),
    professorId,
    'Machine Learning Research Assistant',
    'Help design and evaluate models that match students with research mentors. You will clean datasets, run experiments, and write up results with the lab.',
    'Comfort with Python and a course in machine learning or statistics.',
    JSON.stringify(['Python', 'Machine Learning', 'Data Analysis']),
    JSON.stringify(['Computer Science', 'Artificial Intelligence']),
    'Semester',
    'Stipend',
    2,
    null,
    now,
    now,
  )
  insertOpportunity.run(
    crypto.randomUUID(),
    professorId,
    'Climate Data Analysis Intern',
    'Work with public climate datasets to find patterns in extreme weather. The project mixes statistics, visualization, and a short research paper.',
    'Interest in environmental data and at least one programming language.',
    JSON.stringify(['Python', 'R', 'Statistics']),
    JSON.stringify(['Environmental Science', 'Data Analysis']),
    'Summer',
    'Course credit',
    1,
    null,
    now,
    now,
  )
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL CHECK (role IN ('student', 'professor')) DEFAULT 'student',
      university TEXT,
      department TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      major TEXT,
      graduation_year INTEGER,
      gpa REAL,
      skills TEXT NOT NULL DEFAULT '[]',
      interests TEXT NOT NULL DEFAULT '[]',
      resume_url TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      title TEXT,
      research_areas TEXT NOT NULL DEFAULT '[]',
      lab_name TEXT,
      website_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      professor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      skills_needed TEXT NOT NULL DEFAULT '[]',
      research_areas TEXT NOT NULL DEFAULT '[]',
      duration TEXT,
      compensation TEXT,
      positions_available INTEGER NOT NULL DEFAULT 1,
      application_deadline TEXT,
      status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'filled')) DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (opportunity_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS saved_opportunities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, opportunity_id)
    );
  `)

  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }
  if (count.c === 0) seed(db)
}

export function getDb() {
  if (globalForDb.__scholarsyncDb) return globalForDb.__scholarsyncDb
  const dir = path.join(process.cwd(), '.data')
  fs.mkdirSync(dir, { recursive: true })
  const db = new DatabaseSync(path.join(dir, 'scholarsync.db'))
  migrate(db)
  globalForDb.__scholarsyncDb = db
  return db
}

export const FIELD_TRACKS = ['medical', 'technology', 'both'] as const
export type FieldTrack = (typeof FIELD_TRACKS)[number]

export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const
export type WorkMode = (typeof WORK_MODES)[number]

export const VISA_SUPPORT_OPTIONS = ['yes', 'no', 'case_by_case'] as const
export type VisaSupport = (typeof VISA_SUPPORT_OPTIONS)[number]

export const FIELD_TRACK_LABELS: Record<FieldTrack, string> = {
  medical: 'Medical',
  technology: 'Technology',
  both: 'Medical and technology',
}

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

export const VISA_SUPPORT_LABELS: Record<VisaSupport, string> = {
  yes: 'Visa support available',
  no: 'No visa support',
  case_by_case: 'Visa support considered case by case',
}

export interface ResearchArea {
  name: string
  track: FieldTrack
}

export const RESEARCH_AREAS: ResearchArea[] = [
  { name: 'Clinical Medicine', track: 'medical' },
  { name: 'Public Health', track: 'medical' },
  { name: 'Global Health', track: 'medical' },
  { name: 'Epidemiology', track: 'medical' },
  { name: 'Neuroscience', track: 'medical' },
  { name: 'Genomics', track: 'medical' },
  { name: 'Pharmacology', track: 'medical' },
  { name: 'Oncology', track: 'medical' },
  { name: 'Infectious Disease', track: 'medical' },
  { name: 'Nursing Research', track: 'medical' },
  { name: 'Computer Science', track: 'technology' },
  { name: 'Artificial Intelligence', track: 'technology' },
  { name: 'Data Science', track: 'technology' },
  { name: 'Software Engineering', track: 'technology' },
  { name: 'Cybersecurity', track: 'technology' },
  { name: 'Human-Computer Interaction', track: 'technology' },
  { name: 'Robotics', track: 'technology' },
  { name: 'Computer Vision', track: 'technology' },
  { name: 'Digital Health', track: 'both' },
  { name: 'Bioinformatics', track: 'both' },
  { name: 'Biomedical Engineering', track: 'both' },
  { name: 'Computational Biology', track: 'both' },
  { name: 'Medical Imaging', track: 'both' },
  { name: 'Biology', track: 'medical' },
  { name: 'Chemistry', track: 'medical' },
  { name: 'Physics', track: 'technology' },
  { name: 'Mathematics', track: 'technology' },
  { name: 'Engineering', track: 'technology' },
  { name: 'Psychology', track: 'both' },
  { name: 'Environmental Science', track: 'both' },
]

const MEDICAL_SKILLS = [
  'Clinical Research',
  'Biostatistics',
  'Lab Techniques',
  'Patient Interaction',
  'SPSS',
  'REDCap',
  'PCR',
  'Chart Review',
  'Epidemiology Methods',
  'Medical Imaging',
]

const TECHNOLOGY_SKILLS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'SQL',
  'Machine Learning',
  'C++',
  'Java',
  'React',
  'Cloud Computing',
  'Git',
]

const SHARED_SKILLS = [
  'Statistics',
  'Data Analysis',
  'Scientific Writing',
  'Research Methods',
  'Literature Review',
  'R',
  'MATLAB',
]

const MEDICAL_INTERESTS = [
  'Clinical Trials',
  'Public Health',
  'Neuroscience',
  'Genomics',
  'Global Health',
  'Pharmacology',
  'Oncology',
  'Cardiology',
  'Infectious Disease',
  'Medical Education',
]

const TECHNOLOGY_INTERESTS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Cybersecurity',
  'Human-Computer Interaction',
  'Robotics',
  'Data Science',
  'Software Systems',
  'Computer Vision',
]

const SHARED_INTERESTS = [
  'Bioinformatics',
  'Digital Health',
  'Biomedical Engineering',
  'Computational Biology',
  'Medical Imaging',
]

export function isFieldTrack(value: string | null | undefined): value is FieldTrack {
  return value === 'medical' || value === 'technology' || value === 'both'
}

export function isWorkMode(value: string | null | undefined): value is WorkMode {
  return value === 'remote' || value === 'hybrid' || value === 'onsite'
}

export function isVisaSupport(value: string | null | undefined): value is VisaSupport {
  return value === 'yes' || value === 'no' || value === 'case_by_case'
}

export function suggestedSkills(track: FieldTrack | '' | null | undefined): string[] {
  if (track === 'medical') return [...MEDICAL_SKILLS, ...SHARED_SKILLS]
  if (track === 'technology') return [...TECHNOLOGY_SKILLS, ...SHARED_SKILLS]
  return [...SHARED_SKILLS, ...MEDICAL_SKILLS.slice(0, 4), ...TECHNOLOGY_SKILLS.slice(0, 4)]
}

export function suggestedInterests(track: FieldTrack | '' | null | undefined): string[] {
  if (track === 'medical') return [...MEDICAL_INTERESTS, ...SHARED_INTERESTS]
  if (track === 'technology') return [...TECHNOLOGY_INTERESTS, ...SHARED_INTERESTS]
  return [...SHARED_INTERESTS, ...MEDICAL_INTERESTS.slice(0, 4), ...TECHNOLOGY_INTERESTS.slice(0, 4)]
}

export function researchAreasFor(track: FieldTrack | '' | null | undefined): ResearchArea[] {
  if (!track || track === 'both') return RESEARCH_AREAS
  return [
    ...RESEARCH_AREAS.filter((area) => area.track === track || area.track === 'both'),
    ...RESEARCH_AREAS.filter((area) => area.track !== track && area.track !== 'both'),
  ]
}

export function formatPlace(city?: string | null, country?: string | null): string | null {
  const place = [city?.trim(), country?.trim()].filter(Boolean).join(', ')
  return place || null
}

import assert from 'node:assert/strict'
import { scoreMatch } from '../lib/match'

const medicalStudent = {
  skills: ['Clinical Research', 'Biostatistics', 'Scientific Writing'],
  interests: ['Global Health', 'Epidemiology'],
  field_track: 'medical',
  open_to_remote: true,
  willing_to_relocate: false,
}

const remoteClinical = scoreMatch(
  medicalStudent,
  {
    skills_needed: ['Clinical Research', 'REDCap'],
    research_areas: ['Global Health'],
    field_track: 'medical',
    country: 'United Kingdom',
    work_mode: 'remote',
    open_to_international: true,
  },
  'Nepal',
)

const localOnlyLab = scoreMatch(
  medicalStudent,
  {
    skills_needed: ['Clinical Research'],
    research_areas: ['Clinical Medicine'],
    field_track: 'medical',
    country: 'Germany',
    work_mode: 'onsite',
    open_to_international: false,
  },
  'Nepal',
)

const techRole = scoreMatch(
  medicalStudent,
  {
    skills_needed: ['Rust', 'Distributed Systems'],
    research_areas: ['Cybersecurity'],
    field_track: 'technology',
    country: 'Japan',
    work_mode: 'onsite',
    open_to_international: true,
  },
  'Nepal',
)

assert.ok(remoteClinical.score > localOnlyLab.score, 'remote clinical role should outrank a local-only on-site lab')
assert.ok(localOnlyLab.score <= 0.2, 'a lab closed to international students should not look like a strong match')
assert.ok(remoteClinical.score > techRole.score, 'medical remote role should outrank an unrelated technology lab')
assert.ok(remoteClinical.matchedSkills.includes('Clinical Research'))
assert.match(remoteClinical.reasoning, /remote/i)
assert.match(localOnlyLab.reasoning, /local students/i)

const relocating = scoreMatch(
  { ...medicalStudent, willing_to_relocate: true },
  {
    skills_needed: ['Clinical Research'],
    research_areas: ['Global Health'],
    field_track: 'medical',
    country: 'Singapore',
    work_mode: 'onsite',
    open_to_international: true,
  },
  'Nepal',
)
assert.ok(relocating.score > localOnlyLab.score)
assert.match(relocating.reasoning, /relocating/i)

const crossDisciplinary = scoreMatch(
  {
    skills: ['Python', 'Clinical Research'],
    interests: ['Digital Health'],
    field_track: 'both',
    open_to_remote: true,
    willing_to_relocate: false,
  },
  {
    skills_needed: ['Python'],
    research_areas: ['Digital Health'],
    field_track: 'both',
    country: 'Canada',
    work_mode: 'hybrid',
    open_to_international: true,
  },
  'Canada',
)
assert.ok(crossDisciplinary.score > 0.7)
assert.match(crossDisciplinary.reasoning, /same country/i)

console.log('match checks passed', {
  remoteClinical: Number(remoteClinical.score.toFixed(3)),
  localOnlyLab: Number(localOnlyLab.score.toFixed(3)),
  techRole: Number(techRole.score.toFixed(3)),
  relocating: Number(relocating.score.toFixed(3)),
  crossDisciplinary: Number(crossDisciplinary.score.toFixed(3)),
})

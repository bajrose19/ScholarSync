import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function givenName(fullName: string | null | undefined, fallback: string) {
  const parts = (fullName ?? '').split(/\s+/).filter(Boolean)
  const honorific = /^(dr|prof|professor)\.?$/i
  return parts.find((part) => !honorific.test(part)) || fallback
}

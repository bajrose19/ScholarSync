import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { getViewer } from '@/lib/data'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getViewer()
  if (!profile) redirect('/auth/login')

  const studentProfile = profile.student_profiles
  const professorProfile = profile.professor_profiles

  if (profile.role === 'student' && (!studentProfile?.skills?.length && !studentProfile?.interests?.length)) {
    redirect('/profile/setup')
  }
  if (profile.role === 'professor' && !professorProfile?.research_areas?.length) {
    redirect('/profile/setup')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        profile={profile}
        studentProfile={studentProfile}
        professorProfile={professorProfile}
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}

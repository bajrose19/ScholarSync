import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getViewer } from '@/lib/data'
import { 
  GraduationCap, 
  Sparkles, 
  Users, 
  FileText,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Zap
} from 'lucide-react'

export default async function LandingPage() {
  const profile = await getViewer()
  if (profile) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">ScholarSync</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Research Matching
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Connect with Research Opportunities That{' '}
              <span className="text-primary">Match Your Potential</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
              ScholarSync matches students with research opportunities based on skills, 
              interests, and academic goals. Find your perfect research fit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/sign-up">
                  Start Exploring
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link href="/auth/sign-up?role=professor">
                  Post Opportunities
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How ScholarSync Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform makes finding the perfect research match simple and efficient
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-border/50 bg-card">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                <p className="text-muted-foreground">
                  Add your skills, interests, and academic background so matches reflect
                  what opportunities suit you best.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Get Matches</h3>
                <p className="text-muted-foreground">
                  Overlapping skills and research interests surface the opportunities
                  that align with your goals.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Apply with Ease</h3>
                <p className="text-muted-foreground">
                  Apply to opportunities with one click. Track your applications and
                  review them with professors from one dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">For Students</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Opportunity matching based on your skills',
                  'Explore research positions from professors on this app',
                  'Track all your applications in one place',
                  'Build your research profile and showcase experience',
                  'Save listings and come back to them later',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/auth/sign-up">
                  Sign Up as Student
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">For Professors</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Post research opportunities and reach students',
                  'Skill overlap helps find students with the right background',
                  'Review applications and student profiles efficiently',
                  'Manage multiple positions from one dashboard',
                  'Build your lab team with talented researchers',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline">
                <Link href="/auth/sign-up?role=professor">
                  Sign Up as Professor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Find Your Research Match?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create an account on this machine and start connecting students
              and professors around research.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base">
                <Link href="/auth/sign-up">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold">ScholarSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ScholarSync stores accounts and listings locally on this computer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

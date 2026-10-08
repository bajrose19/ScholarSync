import { NextResponse, type NextRequest } from 'next/server'
import { readSessionToken, SESSION_COOKIE } from '@/lib/session'

export function proxy(request: NextRequest) {
  const userId = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  const { pathname } = request.nextUrl

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/profile')
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/sign-up')

  if (isProtected && !userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

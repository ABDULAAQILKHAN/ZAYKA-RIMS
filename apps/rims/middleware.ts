import { createMiddlewareClient } from '@zayka/auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ROLES = ['desk-manager', 'manager', 'admin']

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Not authenticated → redirect to /login (except if already on /login)
  if (!user) {
    if (pathname === '/login') return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = user.user_metadata?.role as string | undefined

  if (!role || !ALLOWED_ROLES.includes(role)) {
    // Unauthorized role → sign out and redirect to /login
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated + authorized on /login → redirect to /dashboard
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}

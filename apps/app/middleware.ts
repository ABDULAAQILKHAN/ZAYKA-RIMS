// middleware.ts
import { createMiddlewareClient } from '@zayka/auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response: supabaseResponse } = createMiddlewareClient(request)
  let response = supabaseResponse

  // It's crucial to call this before any logic that relies on the user's auth state.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const userRole = user?.user_metadata?.role || 'customer'

  // If user is logged in and on the landing page (root path), redirect them
  if (user && pathname === '/') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (userRole === 'staff') {
      return NextResponse.redirect(new URL('/staff/menu', request.url))
    } else if (userRole === 'manager') {
      return NextResponse.redirect(new URL('/manager/orders', request.url))
    } else if (userRole === 'rider') {
      return NextResponse.redirect(new URL('/rider', request.url))
    } else {
      return NextResponse.redirect(new URL('/menu', request.url))
    }
  }

  // Define route groups
  const protectedRoutes = ['/orders', '/admin', '/staff', '/manager', '/rider', '/checkout', '/cart', '/profile']
  const adminRoutes = ['/admin/dashboard', '/admin/users', '/admin/settings'] // More specific admin routes
  // const staffRoutes = ['/admin', '/orders', '/menu'] // Staff can access these
  const authRoutes = ['/auth/login', '/auth/signup']

  // Redirect authenticated users from auth pages
  if (user && authRoutes.some(route => pathname.startsWith(route))) {
    if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (userRole === 'staff') return NextResponse.redirect(new URL('/staff/menu', request.url)) // Staff goes to staff menu
    if (userRole === 'manager') return NextResponse.redirect(new URL('/manager/orders', request.url))
    if (userRole === 'rider') return NextResponse.redirect(new URL('/rider', request.url))
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  // Redirect unauthenticated users from protected pages
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Role-based access control
  if (user) {
    // Admin-only routes
    if (adminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Admin dashboard access (admin only)
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Staff routes access
    if (pathname.startsWith('/staff') && userRole !== 'admin' && userRole !== 'staff') {
      return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Manager routes access
    if (pathname.startsWith('/manager') && userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Rider routes access
    if (pathname.startsWith('/rider') && userRole !== 'admin' && userRole !== 'rider') {
      return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Prevent riders from accessing customer-only routes (cart, checkout, orders)
    if (userRole === 'rider') {
      if (pathname.startsWith('/cart') || pathname.startsWith('/checkout') || pathname === '/orders') {
        return NextResponse.redirect(new URL('/rider', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
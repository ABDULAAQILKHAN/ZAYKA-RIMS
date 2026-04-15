import { NextResponse, type NextRequest } from "next/server"

const protectedPrefixes = ["/dashboard", "/orders", "/history", "/billing"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")

  if (isPublicAsset) {
    return NextResponse.next()
  }

  const token = request.cookies.get("rims_token")?.value
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
